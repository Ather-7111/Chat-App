export default function ScrollIndex(){
    
    let element = document.getElementById('scrollable-element');

    element.addEventListener('scroll', function() {
        let scrollIndex = element.scrollTop;
        console.log('Scroll index:', scrollIndex);
    });

    return (
        <>

            <div id="scrollable-element" style="height: 200px; overflow-y: scroll;">
                <div style="height: 1000px;">
                    ahkdfcghsdzfclasdukfch
                </div>
            </div>

        </>
    )
}