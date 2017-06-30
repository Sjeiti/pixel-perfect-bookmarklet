/**
 * A small bookmarklet script for pixel-perfect checking designs against implementation.
 * - load/overlay an image per url
 * - remembers what images are loaded to what url
 * - works on dynamic url changes
 * - you can check by opacity, sizing or flipping visibility
 */
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
      ,url = location.href
      ,main,file,inner,image,show,range,horizontal,vertical;
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
  transition:
      left 200ms ease-out 50ms
      ,padding 200ms ease-out 50ms
      ,max-width 200ms ease-out 50ms
      ,max-height 200ms ease-out 50ms
      ,border-radius 200ms ease-out 50ms
      ,bottom 500ms ease;
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
  transition: box-shadow 200ms linear;
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
`<div class="inner" data-html2canvas-ignore>
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
  bg&&setBodyWidth(bg);
  body.appendChild(wrap);
  initEvents();
  requestAnimationFrame(initAfterFrame);

  /**
   * Initialise all the events
   */
  function initEvents(){
    window.addEventListener('popstate', checkOverlay, true);
    body.addEventListener('click', onCheckUrl, true);
    body.addEventListener('keyup', onCheckUrl, true);
    body.addEventListener('keydown', onImageSizeKeyboard, true);
    imgLoader.addEventListener('load',onBodyWidthLoad);
  }

  /**
   * Initialisation after one frame, when the DOM has settled the innerHTML of `wrap`
   */
  function initAfterFrame(){
    main = document.getElementById(name);
    file = main.querySelector('input[type=file]');
    inner = main.querySelector('.inner');
    image = main.querySelector('.image');
    show = main.querySelector('input.show');
    range = main.querySelector('input.opacity');
    horizontal = main.querySelector('input.horizontal');
    vertical = main.querySelector('input.vertical');
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
    requestAnimationFrame(()=>inner.classList.add('added'));
  }

  /**
   * Event handler for user-input events that possibly change the url (click-event, keyup-event)
   */
  function onCheckUrl(){
    requestAnimationFrame(()=>{
      url!==location.href&&checkOverlay();
      url = location.href;
    });
  }

  /**
   * Test if the new overlay is the same as the old one.
   * For when url changes dynamically (ie in SPA)
   */
  function checkOverlay(){
    const oldBg = bg;
    pathname = location.pathname;
    bg = getItem(pathname)||getItem(name);
    oldBg!==bg&&setBackground(bg)
  }

  /**
   * Set the backgroundImage of the image overlay and resizes the body.
   * @param {string} backgroundData
   */
  function setBackground(backgroundData){
    setBodyWidth(backgroundData);
    image.style.backgroundImage = `url(${backgroundData})`;
  }

  /**
   * Set the body width to the loaded image data by 'loading' the image to get the width.
   * @param imageData
   */
  function setBodyWidth(imageData){
    imgLoader.src = imageData;
  }

  /**
   * Resize the page body to reflect the loaded image.
   * Handles the load event of the `imgLoader`
   */
  function onBodyWidthLoad(e){
  	body.style.width = `${e.currentTarget.naturalWidth}px`;
  }

  /**
   * Event handler of the `show` checkbox
   * @param {Event} e
   */
  function onShow(e){
    data.show = e.target.checked;
    setOpacity();
    saveData();
  }

  /**
   * A check for any of the sliders to show the image overlay (flips `show` checkbox)
   * @returns {boolean}
   */
  function showIfHidden() {
    const doShow = !data.show;
    if (doShow) {
      show.checked = data.show = true;
      setOpacity();
    }
    return doShow;
  }

  /**
   * Event handler for the opacity slider
   * @param {Event} e
   */
  function onOpacity(e) {
    data.opacity = e.target.value;
    data.opacity!==0&&showIfHidden()||setOpacity();
    saveData();
  }

  /**
   * Set the opacity of the overlay image
   */
  function setOpacity() {
    image.style.opacity = data.show&&data.opacity||0;
  }

  /**
   * Keyboard event handler for resizing by arrow (pixel)
   * @param {Event} e
   */
  function onImageSizeKeyboard(e) {
    const {keyCode, ctrlKey} = e
      ,isUp = keyCode===key.up
      ,isDown = keyCode===key.down
      ,isLeft = keyCode===key.left
      ,isRight = keyCode===key.right
      ,isVertical = isUp||isDown
      ,isHorizontal = isLeft||isRight
      ,step = ctrlKey?10:1;
    if (isVertical||isHorizontal) {
      const sizeString = isVertical?'height':'width'
          ,size = isVertical?data.height:data.width
          ,offset = isVertical?image.offsetHeight:image.offsetWidth
          ,direction = isUp||isLeft?-1:1
          ,percentage = (size/offset)*(offset+direction*step);
      setImageSize(sizeString,percentage);
    (sizeString==='width'?horizontal:vertical).value = percentage;
      e.preventDefault();
    }
  }

  /**
   * Width/height slider event handler
   * @param {string} size Either `width` or `height`
   * @param {Event} e
   */
  function onImageSize(size,e) {
    setImageSize(size,e.target.value);
  }

  /**
   * Set the overlay image size
   * @param {string} size Either `width` or `height`
   * @param {number} percentage
   */
  function setImageSize(size,percentage){
    image.style[size] = `${percentage}%`;
    data[size] = percentage;
    showIfHidden();
    saveData();
  }

  /**
   * Save data to LocalStorage JSON
   */
  function saveData(){
  	setItem(dataName,JSON.stringify(data));
  	window.tryScreenshot&&window.tryScreenshot();
  }

})();
