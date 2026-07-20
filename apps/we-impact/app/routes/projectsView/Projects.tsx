import { useParams } from "react-router";

export default function ProjectView() {
  const { projectID } = useParams();

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold">Project {projectID}</h1>
    </div>
  );
}
