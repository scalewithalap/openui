import { redirect } from "next/navigation";

const Page = async () => {
  redirect(`/dashboard/workspace`);
};

export default Page;
