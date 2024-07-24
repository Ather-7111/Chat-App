export default function ImageModal() {
    return (
        <>
            <div
                className="fixed top-0 left-0 w-full h-full bg-gray-500 bg-opacity-50 flex justify-center items-center">
                <div className="bg-white p-4 rounded-md shadow-md w-4/5 h-4/5 overflow-auto">
                    {/* Your modal content here */}
                    <img src="https://t3.ftcdn.net/jpg/03/79/17/00/360_F_379170051_7No0Yg8z2uxbyby4Y0WFDNCBZo18tNGr.jpg"
                         alt="Image"/>
                    <button
                        className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 transition duration-300 ease-in-out">
                        Close
                    </button>
                </div>
            </div>
        </>
    );
}