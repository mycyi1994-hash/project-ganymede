// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IVaultToken {
    function balanceOf(address account) external view returns (uint256);
}

/// @title GanymedeBasketVault
/// @notice A basket token backed one for one by its constituents, created and redeemed in kind, the
///         way an ETF's authorized participants deliver and receive the underlying shares. One share
///         is a fixed quantity of each constituent, set at deployment. Creating shares takes exactly
///         that quantity of every token from the caller; redeeming returns it. The vault never
///         prices anything and has no owner, so no one can mint shares without the tokens or move
///         the tokens without burning shares.
/// @dev Shares have 6 decimals. For every constituent, balance × 10^6 ≥ unitsPerShare × totalSupply
///      after every creation and redemption (`isFullyBacked`), or the call reverts. xStocks keep
///      balances as shares times a multiplier, so a transfer can arrive a base unit or two short
///      (on a fork of X Layer mainnet, sending 10^18 AAPLx delivered 10^18 − 1). Creation therefore
///      asks for the exact units rounded up plus ROUNDING_ALLOWANCE, and redemption pays the units
///      rounded down less ROUNDING_ALLOWANCE: a few base units of an 18-decimal token. A token that
///      keeps more, such as a fee on transfer, fails the backing check. Not deployed: it runs
///      against the real xStocks on a fork of X Layer mainnet (npm run fork:vault).
contract GanymedeBasketVault {
    uint8 public constant decimals = 6;
    uint256 public constant SHARE = 1e6;
    uint256 public constant MAX_TOKENS = 20;
    /// @notice Base units added to each creation and kept from each redemption, per token.
    uint256 public constant ROUNDING_ALLOWANCE = 4;

    string public name;
    string public symbol;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    address[] private _tokens;
    /// @dev Token base units per whole share (10^6 share units), one entry per token.
    uint256[] private _unitsPerShare;
    uint256 private _locked = 1;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Created(address indexed account, uint256 shares, uint256[] amounts);
    event Redeemed(address indexed account, uint256 shares, uint256[] amounts);

    error InvalidBasket();
    error InvalidAmount();
    error InsufficientBalance();
    error InsufficientAllowance();
    error TransferFailed();
    error NotFullyBacked();
    error Reentrancy();

    modifier nonReentrant() {
        if (_locked != 1) revert Reentrancy();
        _locked = 2;
        _;
        _locked = 1;
    }

    constructor(string memory name_, string memory symbol_, address[] memory tokens_, uint256[] memory unitsPerShare_) {
        uint256 count = tokens_.length;
        if (count == 0 || count > MAX_TOKENS || unitsPerShare_.length != count) revert InvalidBasket();
        for (uint256 i = 0; i < count; i++) {
            if (tokens_[i] == address(0) || tokens_[i].code.length == 0 || unitsPerShare_[i] == 0) revert InvalidBasket();
            for (uint256 j = 0; j < i; j++) if (tokens_[j] == tokens_[i]) revert InvalidBasket();
        }
        name = name_;
        symbol = symbol_;
        _tokens = tokens_;
        _unitsPerShare = unitsPerShare_;
    }

    function tokens() external view returns (address[] memory) {
        return _tokens;
    }

    function unitsPerShare() external view returns (uint256[] memory) {
        return _unitsPerShare;
    }

    /// @notice What creating `shares` takes and redeeming them returns, per token, allowances included.
    function amountsFor(uint256 shares) public view returns (uint256[] memory createIn, uint256[] memory redeemOut) {
        uint256 count = _tokens.length;
        createIn = new uint256[](count);
        redeemOut = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            uint256 product = _unitsPerShare[i] * shares;
            uint256 exact = product / SHARE;
            createIn[i] = exact + (product % SHARE == 0 ? 0 : 1) + ROUNDING_ALLOWANCE;
            redeemOut[i] = exact > ROUNDING_ALLOWANCE ? exact - ROUNDING_ALLOWANCE : 0;
        }
    }

    /// @notice True when the vault holds at least the constituents of every share outstanding.
    function isFullyBacked() public view returns (bool) {
        for (uint256 i = 0; i < _tokens.length; i++) {
            if (IVaultToken(_tokens[i]).balanceOf(address(this)) * SHARE < _unitsPerShare[i] * totalSupply) return false;
        }
        return true;
    }

    /// @notice Delivers the constituents of `shares` (approve each token first) and mints the shares.
    function create(uint256 shares) external nonReentrant returns (uint256[] memory amounts) {
        if (shares == 0) revert InvalidAmount();
        (amounts, ) = amountsFor(shares);
        for (uint256 i = 0; i < amounts.length; i++) {
            _call(_tokens[i], abi.encodeWithSelector(0x23b872dd, msg.sender, address(this), amounts[i])); // transferFrom
        }
        totalSupply += shares;
        balanceOf[msg.sender] += shares;
        if (!isFullyBacked()) revert NotFullyBacked();
        emit Transfer(address(0), msg.sender, shares);
        emit Created(msg.sender, shares, amounts);
    }

    /// @notice Burns `shares` and returns their constituents to the caller.
    function redeem(uint256 shares) external nonReentrant returns (uint256[] memory amounts) {
        if (shares == 0) revert InvalidAmount();
        if (balanceOf[msg.sender] < shares) revert InsufficientBalance();
        balanceOf[msg.sender] -= shares;
        totalSupply -= shares;
        emit Transfer(msg.sender, address(0), shares);
        (, amounts) = amountsFor(shares);
        for (uint256 i = 0; i < amounts.length; i++) {
            if (amounts[i] > 0) _call(_tokens[i], abi.encodeWithSelector(0xa9059cbb, msg.sender, amounts[i])); // transfer
        }
        if (!isFullyBacked()) revert NotFullyBacked();
        emit Redeemed(msg.sender, shares, amounts);
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            if (allowed < value) revert InsufficientAllowance();
            allowance[from][msg.sender] = allowed - value;
        }
        _transfer(from, to, value);
        return true;
    }

    function _transfer(address from, address to, uint256 value) private {
        if (to == address(0) || to == address(this)) revert InvalidAmount();
        if (balanceOf[from] < value) revert InsufficientBalance();
        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
    }

    /// @dev Accepts tokens that return true or nothing, like OpenZeppelin's SafeERC20.
    function _call(address token, bytes memory data) private {
        (bool ok, bytes memory result) = token.call(data);
        if (!ok || (result.length != 0 && !abi.decode(result, (bool)))) revert TransferFailed();
    }
}
