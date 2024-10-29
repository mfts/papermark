import Nav from "./nav"

interface FigmaViewerProps {
  allowDownload: boolean
  assistantEnabled: boolean
  file: string
  linkId: string
  loading: boolean
  viewId: string
}

const figmaOrigin = "https://www.figma.com";

export default function FigmaViewer(props: FigmaViewerProps) {
  const iframeUrl = props.file + "&client-id=q2elHIhvp0MReH1MJWAQuX"
  window.addEventListener("message", (event) => {
    if (event.origin === figmaOrigin) {
      console.log(event.data);
    }
  })
  return (
    <>
      <Nav
        pageNumber={0}
        numPages={0}
        allowDownload={props.allowDownload}
        assistantEnabled={props.assistantEnabled}
        viewId={props.viewId}
        linkId={props.linkId}
      />
      <div
        hidden={props.loading}
        style={{ height: "calc(100vh - 64px)", width: "100%" }}
        className="flex items-center"
      >
        <div className="mx-auto flex h-full w-full justify-center">
          <iframe src={iframeUrl} className="w-full" />
        </div>
      </div>
    </>
  )
}
