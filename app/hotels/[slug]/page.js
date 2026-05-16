import { notFound } from "next/navigation";
import Nav from "../../../components/Nav";
import Footer from "../../../components/Footer";
import WhatsAppButton from "../../../components/WhatsAppButton";
import HotelDetail from "../../../components/HotelDetail";
import { getHotel } from "../../../lib/api";

export async function generateMetadata({ params }) {
  const hotel = await getHotel(params.slug);
  if (!hotel) return { title: "Hotel not found — Nzzor" };
  return {
    title: `${hotel.name} — Nzzor`,
    description: hotel.description?.slice(0, 155),
  };
}

export default async function HotelPage({ params }) {
  const hotel = await getHotel(params.slug);
  if (!hotel) notFound();

  return (
    <>
      <Nav />
      <HotelDetail hotel={hotel} />
      <Footer />
      <WhatsAppButton />
    </>
  );
}
