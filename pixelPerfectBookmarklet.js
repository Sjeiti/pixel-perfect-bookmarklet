(function(){
	const name = 'pixelPerfect'
      ,getItem = localStorage.getItem.bind(localStorage)
      ,setItem = localStorage.setItem.bind(localStorage)
      ,{body} = document
      ,wrap = document.getElementById(name)||document.createElement('div')
      ,mersenne = Math.pow(2,31)-1
      ,imgLoader = document.createElement('img')
      ,key = {
        left: 37
        ,up: 38
        ,right: 39
        ,down: 40
      }
      ,dataDefault = {
        show: true
        ,opacity: 0.3
        ,width: 100
        ,height: 100
      }
      ,dataName = `${name}Data`
      ,data = Object.assign(dataDefault,JSON.parse(getItem(dataName)))||dataDefault;
  let {pathname} = location
      ,bg = getItem(pathname)||getItem(name)
      ,main
      ,file
      ,inner
      ,image
      ,show
      ,range
      ,horizontal
      ,vertical;
  checkOverlay();
  const style =
`#${name} {
  position: absolute;
  left: 0;
  top: 0;
  z-index: ${mersenne-100};
  width: 100%;
  height: 100%;
  pointer-events: none;
}
#${name}, #${name} * {
  font-family: Helvetica, Verdana, Arial, sans;
  font-size: 12px;
  color: $444;
}
#${name} .inner {
  position: fixed;
  left: 10px;
  bottom: 100vh;
  max-width: 30px;
  max-height: 30px;
  padding: 0;
  background-color: rgba(91,180,0,0.8);
  z-index: ${mersenne-10};
  pointer-events: auto;
  box-shadow: 2px 4px 16px rgba(0,0,0,0.3);
  border-radius: 50%;
  transition: all 200ms ease-out 50ms, bottom 500ms ease;
}
#${name} .inner:after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
}
#${name} .inner.added {
  bottom: 10px;
}
#${name} .inner>* {
  position: relative;
  z-index: ${mersenne-5};
  opacity: 0;
}
#${name} .inner:hover {
  left: 0;
  bottom: 0;
  max-width: 3330px;
  max-height: 3330px;
  border: 0;
  padding: 20px;
  border-radius: 0 4px 0 0;
}
#${name} .inner:hover>* {
  opacity: 1;
}
#${name} .file {
  display: inline-block;
  width: calc(100% - 40px);
  margin-bottom: 20px;
  padding: 8px 16px;
  border-radius: 2px;
  box-shadow: 1px 1px 2px rgba(0,0,0,0.2);
  background-color: rgba(255,255,255,0.2);
  text-align: center;
}
#${name} label {
  display: flex;
  margin: 0 0 8px 0;
  justify-content: space-between;
}
#${name} label, #${name} label * {
  cursor: pointer;
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
  opacity: ${data.show&&data.opacity||0};
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
    <label><span>show/hide</span><input type="checkbox" ${data.show?'checked':''} class="show" /></label>
    <label><span>opacity</span><input type="range" min="0" max="1" step="0.05" value="${data.opacity}" class="opacity" /></label>
    <label><span>horizontal</span><input type="range" min="0" max="100" step="0.1" value="${data.width}" class="horizontal" /></label>
    <label><span>vertical</span><input type="range" min="0" max="100" step="0.1" value="${data.height}" class="vertical" /></label>
</div>
<div class="image"></div>`
  ;
	wrap.id = name;
	wrap.innerHTML = html;
  setTimeout(()=>{
    main = document.getElementById(name);
    file = main.querySelector(`input[type=file]`);
    inner = main.querySelector(`.inner`);
    image = main.querySelector(`.image`);
    show = main.querySelector(`input.show`);
    range = main.querySelector(`input.opacity`);
    horizontal = main.querySelector(`input.horizontal`);
    vertical = main.querySelector(`input.vertical`);
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
            setBackground(result);
            target.value = null;
        })
    });
    show.addEventListener('change',onShow);
    range.addEventListener('input',onOpacity);
    horizontal.addEventListener('input',onImageSize.bind(null,'width'));
    vertical.addEventListener('input',onImageSize.bind(null,'height'));
    setTimeout(()=>inner.classList.add('added'));
  });
  bg&&setBodyWidth(bg);
  imgLoader.addEventListener('load',e=>{
    body.style.width = `${e.currentTarget.naturalWidth}px`;
  });
  body.appendChild(wrap);
  window.addEventListener('popstate', checkOverlay, true);
  body.addEventListener('click', onCheckUrl, true);
  body.addEventListener('keyup', onCheckUrl, true);
  body.addEventListener('keydown', onImageSizeKeyboard, true);
  let url = location.href;
  function onCheckUrl(){
    requestAnimationFrame(()=>{
      url!==location.href&&checkOverlay();
      url = location.href;
    });
  }
  function checkOverlay(){
    const oldBg = bg;
    pathname = location.pathname;
    bg = getItem(pathname)||getItem(name);
    oldBg!==bg&&setBackground(bg)
  }
  function setBackground(backgroundData){
    setBodyWidth(backgroundData);
    image.style.backgroundImage = `url(${backgroundData})`;
  }
  function setBodyWidth(imageData){
    imgLoader.src = imageData;
  }
  function onShow(e){
    data.show = e.target.checked;
    setOpacity();
    saveData();
  }
  function onOpacity(e) {
    data.opacity = e.target.value;
    if (data.opacity!==0&&data.show===false) {
        show.checked = data.show = true;
    }
    setOpacity();
    saveData();
  }
  function setOpacity() {
    image.style.opacity = data.show&&data.opacity||0;
  }
  function onImageSizeKeyboard(e) {
    const {keyCode, ctrlKey} = e
      ,isUp = keyCode===key.up
      ,isDown = keyCode===key.down
      ,isLeft = keyCode===key.left
      ,isRight = keyCode===key.right
      ,value = ctrlKey?10:1;
    if (isUp||isDown) {
      const {offsetHeight} = image;
      setImageSize('height',(data.height/offsetHeight)*(offsetHeight+(isUp?-1:1)*value));
    } else if (isLeft||isRight) {
      const {offsetWidth} = image;
      setImageSize('width',(data.width/offsetWidth)*(offsetWidth+(isLeft?-1:1)*value));
    }
  }
  function onImageSize(size,e) {
    setImageSize(size,e.target.value);
  }
  function setImageSize(size,value){
    image.style[size] = `${value}%`;
    data[size] = value;
    saveData();
  }
  function saveData(){
  	setItem(dataName,JSON.stringify(data));
  }
})();
