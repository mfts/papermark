import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import LoadingSpinner from "../ui/loading-spinner";
import { ChevronLeftIcon, ChevronRightIcon, ZoomIn, ZoomOut } from "lucide-react";
import { useDebounce } from "@/lib/helpers/debounce";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

interface PreviewDocumentModalProps {
    setOpen: Function;
    file: string;
    numPages: number | null;
}

export function PreviewDocumentModal(
    {
        setOpen,
        file,
        numPages
    }: PreviewDocumentModalProps
) {

    const [scale, setScale] = useState(correctScalePerDevice())
    const [loading, setLoading] = useState(true)
    const [pageWidth, setPageWidth] = useState(getWindowWidth());
    const [pageHeight, setPageHeight] = useState(getWindowHeight());
    const [pageNumber, setPageNumber] = useState<number>(numPages || 1); // start on first page


    function getWindowWidth() {
        return window?.innerWidth
    }

    function getWindowHeight() {
        return window?.innerHeight
    }

    // Use suitable scale size w.r.t devices
    function correctScalePerDevice() {
        if (Number(getWindowWidth()) < 675) {
            return 0.8
        }
        else return 1
    }

    const debouncedGoToNextPage =
        useDebounce(() => {
            setPageNumber((prevPageNumber) => prevPageNumber + 1)
        }, 1000);

    const debouncedGoToPreviousPage =
        useDebounce(() => {
            setPageNumber((prevPageNumber) => prevPageNumber - 1)
        }, 1000);

    const debouncedForChangeScale =
        useDebounce((type: string) => {

            if (
                scale <= upperLimit
                &&
                scale >= lowerLimit) {

                setScale(prev => {
                    return (
                        type === ZOOM_TYPE.ZOOM_OUT ?
                            prev - scaleFactor
                            :
                            prev + scaleFactor
                    )
                })
            }
            else if (

                scale > upperLimit
                &&
                type === ZOOM_TYPE.ZOOM_OUT) {

                setScale(prev => {
                    return (
                        type === ZOOM_TYPE.ZOOM_OUT ?
                            prev - scaleFactor
                            :
                            prev + scaleFactor
                    )
                })
            }
            else if (
                scale < 0.8
                &&
                type === ZOOM_TYPE.ZOOM_IN) {

                setScale(prev => {
                    return (
                        type === ZOOM_TYPE.ZOOM_IN ?
                            prev + scaleFactor
                            :
                            prev - scaleFactor
                    )
                })
            }
            else return

        }, 1000);


    const options = {
        cMapUrl: "cmaps/",
        cMapPacked: true,
        standardFontDataUrl: "standard_fonts/",
    };

    // zoom scaling constants
    let scaleFactor = 0.2;
    let lowerLimit = correctScalePerDevice() === 0.8 ? 0.4 : 0.8 //Feel free to play with this
    let upperLimit = 1.8
    let ZOOM_TYPE =
    {
        ZOOM_IN: 'zoomIn',
        ZOOM_OUT: 'zoomOut'
    }

    // handlers for document preview
    const handleClose = () => {
        setOpen(false)
    }

    const goToNextPage = () => {
        debouncedGoToNextPage()
    }

    const goToPreviousPage = () => {
        debouncedGoToPreviousPage()
    }

    const onChangeScale = (type: string) => {
        debouncedForChangeScale(type)
    }

    function onPageLoadSuccess() {
        setLoading(false);
    }

    // Listener for minimizing and maximizing window size
    useEffect(() => {
        function handleResize() {
            // setPageHeight(window.innerHeight);
            // setPageWidth(window.innerWidth)
            // During resizing zoomout for mobile devices
            // Zoomin for maximizing for larger devices
            correctScalePerDevice() === 0.8 ?
                debouncedForChangeScale(ZOOM_TYPE.ZOOM_OUT)
                :
                debouncedForChangeScale(ZOOM_TYPE.ZOOM_IN)

        }

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);


    return (
        <div className="relative z-50 " aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="fixed  inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div className="
                 flex  items-center min-h-full w-full 
                 justify-center p-4 text-center sm:items-center sm:p-0">

                    <div className="absolute right-12 top-7">
                        <div
                            onClick={handleClose}
                            className="
                             bg-slate-100 hover:cursor-pointer hover:text-slate-500 h-16 w-16
                               flex justify-center items-center rounded-full p-2 text-gray-900">
                            <span className="text-2xl">X</span>
                        </div>
                    </div>


                    <div
                        className="
                             absolute left-32 top-7
                            bg-gray-500 hover:cursor-pointer
                             hover:text-slate-500 h-10  flex justify-center
                              items-center rounded-full p-2 text-slate-100">

                        <div className="
                        bg-gray-900  flex text-white rounded-md
                         px-3 py-2 text-sm font-medium">
                            <span>Page: {pageNumber}</span>
                            <span> / {numPages}</span>
                        </div>
                    </div>

                    <button
                        onClick={goToPreviousPage}
                        disabled={pageNumber <= 1}
                        className="
                            bg-gray-500 hover:cursor-pointer
                              absolute top-[85vh] lg:top-80 left-5
                             hover:text-slate-500 h-10 w-10 flex justify-center
                              items-center rounded-full p-2 text-slate-100">

                        <ChevronLeftIcon className="h-10 w-10 text-slate-300" />
                    </button>

                    <button
                        onClick={goToNextPage}
                        disabled={pageNumber >= numPages!}
                        className="
                            bg-gray-500 hover:cursor-pointer
                            absolute top-[85vh] lg:top-80 right-5
                             hover:text-slate-500 h-10 w-10 flex justify-center
                              items-center rounded-full p-2 text-slate-100">

                        <ChevronRightIcon className="h-10 w-10 text-slate-300" />
                    </button>

                    <div className="absolute left-8 top-7">
                        <div
                            onClick={() => onChangeScale(ZOOM_TYPE.ZOOM_IN)}
                            className="
                            bg-slate-100 hover:cursor-pointer
                             hover:text-slate-500 h-10 w-10 flex justify-center
                              items-center rounded-full p-2 text-gray-900">

                            <ZoomIn className="h-7 w-7 " color="gray" />
                        </div>
                    </div>

                    <div className="absolute left-20 top-7">
                        <div
                            onClick={() => onChangeScale(ZOOM_TYPE.ZOOM_OUT)}
                            className="
                            bg-slate-100 hover:cursor-pointer
                             hover:text-slate-500 h-10 w-10 flex justify-center
                              items-center rounded-full p-2 text-gray-900">

                            <ZoomOut className="h-7 w-7" color="gray" />
                        </div>
                    </div>

                    <div className="w-full h-full flex justify-center items-center">
                        {
                            loading
                            &&
                            <LoadingSpinner className="h-16 mx-12 w-16 text-slate-800" />
                        }

                        <Document
                            file={file}
                            loading={false}
                            renderMode="canvas"
                            options={options}
                            className=""

                        >
                            <Page
                                key={pageNumber}
                                pageNumber={pageNumber}
                                renderAnnotationLayer={false}
                                renderTextLayer={false}
                                scale={scale}
                                onLoad={() => setLoading(true)}
                                onLoadSuccess={onPageLoadSuccess}
                                onRenderError={() => setLoading(false)}
                                width={Math.max(pageWidth * 0.4, 390)}
                                height={Math.max(pageHeight * 0.4, 390)}
                            />
                        </Document>

                    </div>
                </div>
            </div>
        </div>
    );
}
