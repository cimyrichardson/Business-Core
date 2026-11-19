import type { Metadata } from "next";
import ChannelsContent from "./ChannelsContent";

export const metadata: Metadata = {
  title: "Mesaj ak rapò — Business Core",
};

export default function ChannelsPage() {
  return <ChannelsContent />;
}
