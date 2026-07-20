import { useParams } from "react-router";

export default function ProjectView() {
  const { id } = useParams();

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold">Project {id}</h1>
    </div>
  );
}
