import { ProductShell } from "../product-ui/ProductShell";
import { AccountUnavailable } from "../product-ui/ProductScreens";
export const metadata = { title: "Activity · Ganymede" };
export default function ActivityPage() { return <ProductShell section="activity"><AccountUnavailable activity /></ProductShell>; }
