import FileViewer from 'react-file-viewer';

const file = 'http://example.com/image.png'
const type = 'png'

export default function FilePreview() {
    return (
        <FileViewer
            fileType={type}
            filePath={file}/>
    );
}