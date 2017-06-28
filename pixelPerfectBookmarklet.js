(function(){
	const name = 'pixelPerfect'
        ,{body} = document
        ,wrap = document.getElementById(name)||document.createElement('div')
        ,mersenne = Math.pow(2,31)-1
        ,bg = localStorage.getItem('bg')
        ,imgLoader = document.createElement('img')
        ,opacity = 0.3
        ,style =
`#${name} {
    position: absolute;
    left: 0;
    top: 0;
    z-index: ${mersenne-1};
    width: 100%;
    height: 100%;
    pointer-events: none;
}
#${name} .inner {
    position: fixed;
    left: 0;
    bottom: 0;
    padding: 22px 24px 10px 20px;
    background-color: rgba(91,180,0,0.8);
    z-index: ${mersenne};
    pointer-events: auto;
    box-shadow: 0 0 32px rgba(0,0,0,0.3);
    border-top-right-radius: 100%;
}
#${name} .image {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-image: url(${bg});
    background-repeat: no-repeat;
    opacity: ${opacity};
}
#${name} .visually-hidden {
    position: absolute;
    overflow: hidden;
    clip: rect(0 0 0 0);
    height: 1px; width: 1px;
    margin: -1px; padding: 0; border: 0;
}`
        ,html =
`<div class="inner">
    <style>${style}</style>
    <label>add image<input class="visually-hidden" type="file" accept="image/gif, image/jpg, image/jpeg, image/png, image/svg, .gif, .jpg, .jpeg, .png, .svg" /></label>
    <input type="range" min="0" max="1" step="0.05" value="${opacity}" />
</div>
<div class="image"></div>`
;
    wrap.id = name;
    wrap.innerHTML = html;
        setTimeout(()=>{
            const file = body.querySelector(`#${name} input[type=file]`)
                ,image = body.querySelector(`#${name} .image`)
                ,range = body.querySelector(`#${name}  input[type=range]`);
            file.addEventListener('change',e=>{
                const target = e.target
                    ,fileReader = new FileReader()
                    ,file = target.files[0];
                fileReader.readAsDataURL(file);
                fileReader.addEventListener('load', ()=>{
                    const result = fileReader.result;
                    localStorage.setItem('bg',result);
                    setBodyWidth(result);
                    image.style.backgroundImage = `url(${result})`;
                    target.value = null
                })
            });
            range.addEventListener('input',e=>{
                const target = e.target
                    ,value = target.value;
                image.style.opacity = value;
            });
    });
    bg&&setBodyWidth(bg);
    imgLoader.addEventListener('load',e=>{
        body.style.width = `${e.currentTarget.naturalWidth}px`;
    });
    body.appendChild(wrap);
    function setBodyWidth(imageData){
      imgLoader.src = imageData
    }
})();
