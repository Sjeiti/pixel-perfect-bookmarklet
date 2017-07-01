/**
 * A small bookmarklet script for pixel-perfect checking designs against implementation.
 * - load/overlay an image per url
 * - remembers what images are loaded to what url
 * - works on dynamic url changes
 * - you can check by opacity, sizing or flipping visibility
 * In order to enforce breakpoints the bookmarklet inserts a page in which it loads itself, this means your CORS settings should be set accordingly (shouldn't be a problem for developer servers).
 */
(function(){

  /**
   * The overlay-item stored in localStorage
   * @typedef {Object} overlayItem
   * @property {string} data
   * @property {number} lastModified
   * @property {string} name
   * @property {number} naturalWidth
   * @property {number} naturalHeight
   */

	const name = 'pixelPerfect'
      ,storageGet = localStorage.getItem.bind(localStorage)
      ,storageSet = localStorage.setItem.bind(localStorage)
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
      ,data = Object.assign(dataDefault,JSON.parse(storageGet(dataName)))||dataDefault;
  let {pathname} = location
      ,list = getList()
      ,selectedItem = lastListItem()
      ,url = location.href
      ,main,file,orderedList,inner,image,show,range,horizontal,vertical,styleSheet,widthStyleRule;
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
#${name} ol {
  margin: 0 0 20px 0;
  padding: 0;
  list-style: none;
}
#${name} li {
  display: inline-block;
  cursor: pointer;
}
#${name} li.current {
  font-weight: bold;
}
#${name} li:not(:first-child) {
  padding: 0 5px;
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
  background-image: url(${selectedItem.data||''});
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
}
body, html {
  width: 100%;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
}
iframe.${name} {
  min-width: 100%;
  min-height: 100%;
  max-height: 100%;
}`
      ,html =
`<div class="inner" data-html2canvas-ignore>
    <style title="${name}">${style}</style>
    <label class="file">
        add image
        <input class="visually-hidden" type="file" accept="image/gif, image/jpg, image/jpeg, image/png, image/svg, .gif, .jpg, .jpeg, .png, .svg" />
    </label>
    <ol></ol>
    <label><span>show/hide</span><input type="checkbox" ${data.show?'checked':''} class="show" /></label>
    <label><span>opacity</span><input type="range" min="0" max="1" step="0.05" value="${data.opacity}" class="opacity" /></label>
    <label><span>horizontal</span><input type="range" min="0" max="100" step="0.1" value="${data.width}" class="horizontal" /></label>
    <label><span>vertical</span><input type="range" min="0" max="100" step="0.1" value="${data.height}" class="vertical" /></label>
</div>
<div class="image"></div>`
  ;
	wrap.id = name;
	wrap.innerHTML = html;
  setBodyWidth(selectedItem.data);
  body.innerHTML = `<iframe src="${location.href}" class="${name}" frameborder="0"></iframe>`;
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
    orderedList = main.querySelector('ol');
    inner = main.querySelector('.inner');
    image = main.querySelector('.image');
    show = main.querySelector('input.show');
    range = main.querySelector('input.opacity');
    horizontal = main.querySelector('input.horizontal');
    vertical = main.querySelector('input.vertical');
    inner.addEventListener('mousedown',()=>{wrap.classList.add('mousedown')});
    body.addEventListener('mouseup',()=>{wrap.classList.remove('mousedown')});
    file.addEventListener('change',onFileChange);
    orderedList.addEventListener('click',onSelectItem);
    show.addEventListener('change',onShow);
    range.addEventListener('input',onOpacity);
    horizontal.addEventListener('input',onImageSize.bind(null,'width'));
    vertical.addEventListener('input',onImageSize.bind(null,'height'));

    requestAnimationFrame(()=>inner.classList.add('added'));

    Array.from(document.styleSheets).forEach(sheet=>{
      if (sheet.title===name) styleSheet = sheet;
    });
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
   * Get the list of stored items
   * @returns {overlayItem[]}
   */
  function getList(){
  	const listRaw = storageGet(pathname)||storageGet(name);
    return listRaw?JSON.parse(listRaw):[];
  }

  /**
   * Get last item on the list
   * @returns {overlayItem}
   */
  function lastListItem(){
    return list&&list.slice(0).pop()||{};
  }

  /**
   * Test if the new overlay is the same as the old one.
   * For when url changes dynamically (ie in SPA)
   */
  function checkOverlay(){
    const oldItem = selectedItem;
    pathname = location.pathname;
    list = getList();
    let hasItem = false;
    list.forEach(item=>{
      if (item.data===oldItem.data) {
        hasItem = true;
      }
    });
    if (!hasItem) {
      selectedItem = lastListItem();
      setBackground(selectedItem.data);
    }
  }

  /**
   * Set the backgroundImage of the image overlay and resizes the body.
   * @param {string} backgroundData
   */
  function setBackground(backgroundData){
    setBodyWidth(backgroundData);
    if (image) image.style.backgroundImage = `url(${backgroundData})`;
  }

  /**
   * Set the body width to the loaded image data by 'loading' the image to get the width.
   * @param imageData
   */
  function setBodyWidth(imageData){
    if (imageData) imgLoader.src = imageData;
  }

  /**
   * File input value has changed
   * @param {Event} e
   */
  function onFileChange(e){
    const target = e.target
        ,fileReader = new FileReader()
        ,file = target.files[0];
    selectedItem = {name:file.name,lastModified:file.lastModified};
    fileReader.addEventListener('load', onImageLoad);
    fileReader.readAsDataURL(file);
  }

  /**
   * FileReader has loaded file
   * @param {Event} e
   */
  function onImageLoad(e){
    const fileReader = e.target
        ,result = fileReader.result;
    setBackground(result.toString());
    if (selectedItem) selectedItem.data = result;
    file.value = null;
  }

  /**
   * Resize the page body to reflect the loaded image.
   * Handles the load event of the `imgLoader`
   */
  function onBodyWidthLoad({currentTarget}){
    const {naturalWidth,naturalHeight} = currentTarget
        ,style = `max-width:${naturalWidth}px;width:${naturalWidth}px;`;

    if (selectedItem) {
      Object.assign(selectedItem,{naturalWidth,naturalHeight});
      listPush(selectedItem);
      fillOrderedList();
    }
    storageSet(name,JSON.stringify(list));
    storageSet(pathname,JSON.stringify(list));

    if (!widthStyleRule) {
      getStyleSheet().addRule(`html, body, iframe.${name}`,style);
      widthStyleRule = styleSheet.rules[styleSheet.rules.length-1];
    } else {
      widthStyleRule.style = style;
    }
  }

  /**
   * Click handler for ordered list
   * @param {HTMLLIElement} target
   */
  function onSelectItem({target}){
    const naturalWidth = parseInt(target.innerText,10);
    list.forEach(item=>{
      if (item.naturalWidth===naturalWidth) selectedItem = item;
    });
    selectedItem&&setBackground(selectedItem.data);
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
   * Add an item to the list while retaining order.
   * @param {overlayItem} item
   */
  function listPush(item) {
    const {naturalWidth} = item;
    let existingIndex;
    list.forEach((item,i)=>{
      if (item.naturalWidth===naturalWidth) {
        existingIndex = i;
      }
    });
    existingIndex!==undefined&&list.splice(existingIndex, 1);
    !list.includes(item)&&list.push(item);
    list.sort((a,b)=>a.naturalWidth>b.naturalWidth?1:-1);
  }

  /**
   * Fill the ordered-list with currently saved items
   */
  function fillOrderedList() {
    let innerHTML = '';
    list.forEach(item=>{
      innerHTML += `<li${item===selectedItem?' class="current"':''}>${item.naturalWidth}</li>`;
    });
    orderedList.innerHTML = innerHTML;
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
  	storageSet(dataName,JSON.stringify(data));
  }

  /**
   * Get the stylesheet
   * @returns {CSSStyleSheet}
   */
  function getStyleSheet(){
    styleSheet||Array.from(document.styleSheets).forEach(sheet=>{
      if (sheet.title===name) styleSheet = sheet;
    });
    return styleSheet;
  }

})();
