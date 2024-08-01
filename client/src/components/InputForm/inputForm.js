// InputForm.js


import {IoMdSend} from "react-icons/io";
import {MdAttachment} from "react-icons/md";
import {useRef} from "react";

const InputForm = ({
                       message,
                       setMessage,
                       file,
                       onChange,
                       fileInputRef,
                       handleSendMessage,
                   }) => {



    return (
        <div className="input-group mb-0 flex bg-gray-800 p-2 rounded-lg">
            <form onSubmit={handleSendMessage} className="flex w-full">
                <input
                    onChange={(e) => setMessage(e.target.value)}
                    value={message}
                    name="message"
                    className="flex-grow p-4 bg-gray-700 text-white outline-none rounded-lg resize-none placeholder-gray-400"
                    placeholder="Enter text here..."
                />

                <div className="flex justify-center items-center ml-2">
                    <input
                        type="file"
                        id="file"
                        multiple
                        onChange={onChange}
                        ref={fileInputRef}
                        // style={{display: 'none'}}
                    />
                    {/*<label htmlFor="id" className="text-gray-400 hover:text-gray-200 cursor-pointer">*/}
                    {/*    <img src={"attachment.svg"} width={20} alt="attachmentLogo"/>*/}
                    {/*    /!*abc*!/*/}
                    {/*</label>*/}
                </div>

                <button type="submit" className="ml-2 text-gray-400 hover:text-gray-200">
                    <IoMdSend className="text-3xl"/>
                </button>
            </form>
        </div>
    );
};

export default InputForm;