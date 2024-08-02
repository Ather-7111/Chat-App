import {Oval} from "react-loader-spinner";
import {defaultStyles, FileIcon} from "react-file-icon";

function getformat(fileType) {
    let object = {
        "image/png": "png",
        "image/jpeg": "jpg",
        "application/pdf": "pdf",
        "video/mp4": "mp4",
        "application/vnd.ms-powerpoint": "ppt",
        "text/plain": "txt",
        "application/vnd.openxmlformats": "docx",
        "application/msword": "doc",
        "application/vnd.ms-excel": "xls",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
        "application/x-zip-compressed": "zip",
        "": "data:application/octet-stream",
    };
    return object[fileType];
}

const LoadingAttachments = (message)=>{
    console.log("message", message?.message?.attachmentUrl)
    const fileAttachmentUrl = message?.message?.attachmentUrl || message?.attachment?.url
    console.log("fileAttachmentUrl-->", fileAttachmentUrl)

    const fileTypeMime = fileAttachmentUrl?.split(';')?.shift();
    console.log("fileTypeMime", fileTypeMime)

    const fileTypeExtension = getformat(message?.message?.filetype)
    console.log("fileTypeExtension-->", fileTypeExtension)


    const isSenderUrlExists = fileAttachmentUrl?.startsWith(fileTypeMime)
    console.log("isSenderExists-->", isSenderUrlExists)

    const isReceiverUrlExists = fileAttachmentUrl?.endsWith(fileTypeExtension)
    console.log("isReceiverExists-->", isReceiverUrlExists)

    if (isSenderUrlExists || isReceiverUrlExists) {
        return (
            <div
                key={fileTypeExtension}
                className="flex flex-col">
                <div
                    className="attachment-thumbnail rounded-t-xl"
                    style={{
                        width: "496px",
                        height: "250px",
                        display: "flex",
                        alignItems: "end",
                        justifyContent: "center",
                        overflow: "hidden",
                        position: "relative",
                        backgroundColor: "#f8f9fa",
                    }}
                >
                    <FileIcon
                        extension={fileTypeExtension}
                        {...defaultStyles[fileTypeExtension]}

                        style={{
                            position: "absolute",
                            maxWidth: "100%",
                            maxHeight: "100%",
                        }}
                    />
                </div>
                <div
                    className="flex justify-between bg-gray-800 shadow-lg py-5 px-2 rounded-b-xl">
                    <div
                        className='w-[20px]'>
                        <FileIcon
                            extension={fileTypeExtension}
                            {...defaultStyles[fileTypeExtension]}
                        />
                    </div>

                    <p className="text-white hover:underline">
                        {`View ${fileTypeExtension} attachment`}
                    </p>
                    <div>
                        <Oval
                            visible={true}
                            height="20"
                            width="20"
                            color="#fff"
                            ariaLabel="oval-loading"
                            wrapperStyle={{}}
                            wrapperClass=""
                        />
                    </div>
                </div>
            </div>
        )
    }
}

export default LoadingAttachments