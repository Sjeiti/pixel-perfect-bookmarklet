(function(){
	const name = 'pixelPerfect'
      ,getItem = localStorage.getItem.bind(localStorage)
      ,setItem = localStorage.setItem.bind(localStorage)
      ,{body} = document
      ,wrap = document.getElementById(name)||document.createElement('div')
      ,mersenne = Math.pow(2,31)-1
      ,{pathname} = location
      ,bg = getItem(pathname)||getItem(name)
      ,imgLoader = document.createElement('img')
      ,dataName = `${name}Data`
      ,data = JSON.parse(getItem(dataName))||{
        opacity: 0.3
        ,width: 100
        ,height: 100
      }
      ,style =
`#${name} {
  position: absolute;
  left: 0;
  top: 0;
  z-index: ${mersenne-1};
  width: 100%;
  height: 100%;
  pointer-events: none;
  font-family: Helvetica, Verdana, Arial, sans;
  font-size: 12px;
  color: $444;
}
#${name} .inner {
  position: fixed;
  left: 10px;
  bottom: 10px;
  max-width: 30px;
  max-height: 30px;
  padding: 0;
  background-color: rgba(91,180,0,0.8);
  z-index: ${mersenne};
  pointer-events: auto;
  box-shadow: 2px 4px 16px rgba(0,0,0,0.3);
  border-radius: 50%;
  transition: all 200ms ease-out;
  overflow: hidden;
}
#${name} .inner>* {
  opacity: 0;
}
#${name} .inner:hover {
  left: 0;
  bottom: 0;
  max-width: 3330px;
  max-height: 3330px;
  padding: 22px 40px 20px 20px;
  border-radius: 0 4px 0 0;
}
#${name} .inner:hover>* {
  opacity: 1;
}
#${name} .file {
  display: inline-block;
  margin-bottom: 8px;
  padding: 8px 16px;
  border-radius: 2px;
  box-shadow: 1px 1px 2px rgba(0,0,0,0.2);
  background-color: rgba(255,255,255,0.2);
}
#${name} label {
  display: flex;
  justify-content: space-between;
}
#${name} label * {
  vertical-align: middle;
}
#${name} label input {
  margin-left: 10px;
}
input[type=range] {
  width: 200px;
}
#${name} .image {
  position: absolute;
  left: 0;
  top: 0;
  width: ${data.width}%;
  height: ${data.height}%;
  background-image: url(${bg});
  background-repeat: no-repeat;
  opacity: ${data.opacity};
}
#${name}.mousedown .image {
  box-shadow: 0 0 32px rgba(0,0,0,0.3);
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
    <label class="file">
        add image
        <input class="visually-hidden" type="file" accept="image/gif, image/jpg, image/jpeg, image/png, image/svg, .gif, .jpg, .jpeg, .png, .svg" />
    </label><br/>
    <label><span>opacity</span><input type="range" min="0" max="1" step="0.05" value="${data.opacity}" class="opacity" /></label>
    <label><span>horizontal</span><input type="range" min="0" max="100" step="0.1" value="${data.width}" class="horizontal" /></label>
    <label><span>vertical</span><input type="range" min="0" max="100" step="0.1" value="${data.height}" class="vertical" /></label>
</div>
<div class="image"></div>`
  ;
	wrap.id = name;
	wrap.innerHTML = html;
  setTimeout(()=>{
    const file = body.querySelector(`#${name} input[type=file]`)
        ,inner = body.querySelector(`#${name} .inner`)
        ,image = body.querySelector(`#${name} .image`)
        ,range = body.querySelector(`#${name} input.opacity`)
        ,horizontal = body.querySelector(`#${name} input.horizontal`)
        ,vertical = body.querySelector(`#${name} input.vertical`);
    inner.addEventListener('mousedown',()=>{wrap.classList.add('mousedown')});
    body.addEventListener('mouseup',()=>{wrap.classList.remove('mousedown')});
    file.addEventListener('change',e=>{
        const target = e.target
            ,fileReader = new FileReader()
            ,file = target.files[0];
        fileReader.readAsDataURL(file);
        fileReader.addEventListener('load', ()=>{
            const result = fileReader.result;
            setItem(name,result);
            setItem(pathname,result);
            setBodyWidth(result);
            image.style.backgroundImage = `url(${result})`;
            target.value = null;
        })
    });
    range.addEventListener('input',setOpacity.bind(null,image));
    horizontal.addEventListener('input',setImageSize.bind(null,image,'width'));
    vertical.addEventListener('input',setImageSize.bind(null,image,'height'));
  });
  bg&&setBodyWidth(bg);
  imgLoader.addEventListener('load',e=>{
    body.style.width = `${e.currentTarget.naturalWidth}px`;
  });
  body.appendChild(wrap);
  function setBodyWidth(imageData){
    imgLoader.src = imageData;
  }
  function setOpacity(image,e) {
    data.opacity = image.style.opacity = e.target.value;
    saveData();
  }
  function setImageSize(image,size,e) {
    const value = e.target.value;
    image.style[size] = `${value}%`;
    data[size] = value;
    saveData();
  }
  function saveData(){
  	setItem(dataName,JSON.stringify(data));
  }
})();
