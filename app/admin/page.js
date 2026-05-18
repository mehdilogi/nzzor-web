import AdminApp from "./AdminApp";

export const metadata = {
  title: "Nzzor Admin",
  robots: { index: false, follow: false },
};

export default function Admin() {
  return <AdminApp />;
}
