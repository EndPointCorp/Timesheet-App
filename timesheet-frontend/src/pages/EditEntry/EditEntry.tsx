import { useParams } from "react-router-dom";
import { workEntriesHooks } from "../../hooks";
import NewEntry from "../NewEntry";
import axios from "axios";

axios.defaults.xsrfCookieName = "CSRF-TOKEN";
axios.defaults.xsrfHeaderName = "X-CSRF-Token";

const EditEntry = () => {
  let { entryId } = useParams();
  const { data: entry, isLoading } = workEntriesHooks.useGetEntry({
    id: Number(entryId),
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <NewEntry entry={entry} entryId={Number(entryId)} />;
};

export default EditEntry;
