import { notFound } from "next/navigation";

export default function CustomNotFound() {
  const error = { error: "Page not found", status: 404 };

  return (
    <div
      style={{
        margin:0,
        padding:0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        maxWidth:"100vw",
        fontFamily: "monospace",
        background:"black",
        color:"white"
      }}
    >
      <pre style={{fontSize: "24px"}}>{JSON.stringify(error, null, 2)}</pre>
    </div>
  );
}
