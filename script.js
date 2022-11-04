"use strict";
const editPanelInputs = document.querySelector('.edit-panel').querySelectorAll('input');
const editPanelBoxes = document.querySelector('.edit-panel').querySelectorAll('.box');

const showCodeLoadBtn = document.querySelector('#show-code-load-btn');
const codeLoadBtn = document.querySelector('#code-load-btn');
const codeLoadDialog = document.querySelector('#code-load');
const codeLoadBox = codeLoadDialog.querySelector('.code-load-box');
const codeDate = document.querySelector('#box-date input');

const showCodeBtn = document.querySelector('#code-preview-btn');
const copyCodeBtn = document.querySelector('#code-preview-copy');
const preViewPanel = document.querySelector('.view-panel');
const codePreviewDialog = document.querySelector('#code-preview');
const codePreviewBox = codePreviewDialog.querySelector('.code-preview-box');

const closeDialogBtn = document.querySelectorAll('.closeDialogJs');

const galleryPZ = {
    galleryPZData: {},
    tplDomHtml: 'empty',
    galleryPZes: false,
    isLocalStorage: false,
    
    init() {
        const LsgalleryPZ = localStorage.getItem("galleryPZData");

        if(LsgalleryPZ) {
            this.isLocalStorage = true;
            this.galleryPZData = JSON.parse(LsgalleryPZ);
        }

        fetch('galleryPZ-template.xml')
        .then(response => response.text())
        .then(data => {
            this.loadCode(data);

            showCodeBtn.addEventListener('click', () => {
                codePreviewDialog.showModal();
            });
        });

        showCodeLoadBtn.addEventListener('click', () => {
            codeLoadDialog.showModal();
        });

        closeDialogBtn.forEach(el => {
            el.addEventListener('click', () => {
                el.closest('dialog').close();
            });
        });

        copyCodeBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(codePreviewBox.value);
            codePreviewDialog.close();

            alert('Kod skopiowano do schowka');
        });

        codeLoadBtn.addEventListener('click', e => {
            const codeLoadedByUser = true;
            this.loadCode(codeLoadBox.value, codeLoadedByUser);

            codeLoadDialog.close();
            codeLoadBox.value = '';
        });
    },
    loadCode(code, codeLoadedByUser = false) {
        const htmlContainer = document.createElement('div');
        htmlContainer.setAttribute('id', 'htmlContainer');
        htmlContainer.innerHTML = code;
        this.tplDomHtml = htmlContainer;
        this.galleryPZ = this.tplDomHtml.querySelector('.genjs_galleryPZ');
        this.galleryPZes = this.galleryPZ.querySelectorAll('.genjs_box');
      
        this.parseTemplate(codeLoadedByUser);
        this.reloadPreview(true);
    },
    updateDate(date) {
        if(!date) {
            alert('Brak daty!');
            return;
        }

        this.galleryPZData.galleryPZDate = date;
        this.galleryPZ.dataset.banername = this.dateStringToBanernameAttr(date);
        this.saveStateToLocalStorage();
        this.reloadPreview();
    },
    banernameAttrToDateString(banername) {
        const dateArr = banername.slice(-8).split('-');
        let [day, mon, year] = dateArr;
        year = `20${year}`;

        return `${year}-${mon}-${day}`;
    },
    dateStringToBanernameAttr(dateString) {
        const dateArr = dateString.slice(2).split('-');
        let [year, mon, day] = dateArr;

        return `galleryPZ_${day}-${mon}-${year}`;
    },
    parseTemplate(codeLoadedByUser = false) {
        if(this.isLocalStorage && !codeLoadedByUser) {
            this.tplDomHtml.firstElementChild.dataset.banername = this.dateStringToBanernameAttr(this.galleryPZData.galleryPZDate);

            this.galleryPZes.forEach((el, id) => {
                this.setUrlsInDomHtml(el.querySelector('.genjs_link'), id, 'link');
                this.setUrlsInDomHtml(el.querySelector('.genjs_img'), id, 'img');
                this.setUrlsInDomHtml(el.querySelector('.genjs_img_hover'), id, 'img_hover');
            });
        } else {
            this.galleryPZData.galleryPZDate = this.banernameAttrToDateString(this.tplDomHtml.firstElementChild.dataset.banername);
            this.galleryPZData.items = [];

            this.galleryPZes.forEach((el, id) => {
                this.galleryPZData.items[id] = {};
                this.galleryPZData.items[id]['link'] = el.querySelector('.genjs_link').getAttribute('href');
                this.galleryPZData.items[id]['img'] = el.querySelector('.genjs_img').getAttribute('data-src');
                this.galleryPZData.items[id]['img_hover'] = el.querySelector('.genjs_img_hover').getAttribute('data-src');
            });

            this.saveStateToLocalStorage();
        }
    },
    reloadPreview(fromInit = false) {
        preViewPanel.innerHTML = this.tplDomHtml.innerHTML;
        codePreviewBox.textContent = this.tplDomHtml.innerHTML;

        preViewPanel.querySelectorAll('img[data-src]').forEach(el => {
            el.setAttribute('src', el.getAttribute('data-src'));
        });

        codeDate.value = this.galleryPZData.galleryPZDate;

        if(fromInit) this.panelFormUpdate();

        sliderInit.init();
    },
    galleryPZUpdate(boxId, fieldName, value) {
        if(value === '') {
            alert(`Wpisz wartość "${fieldName}" w boksie ${boxId + 1}`);
            return;
        }

        if(fieldName === 'link') {
            value = `/${value.replace(/^\/+/g, '')}`;
        }

        this.galleryPZData.items[boxId][fieldName] = value;
        this.saveStateToLocalStorage();

        this.tplDomHtmlUpdate(boxId, fieldName);

        if(fieldName === 'link') {
            this.panelFormUpdate(boxId, fieldName);
        }
    },
    saveStateToLocalStorage() {
        localStorage.setItem("galleryPZData", JSON.stringify(this.galleryPZData));
    },
    tplDomHtmlUpdate(boxId = null, fieldName = null) {
        this.setUrlsInDomHtml(this.galleryPZes[boxId].querySelector(`.genjs_${fieldName}`), boxId, fieldName);

        this.reloadPreview();
    },
    switchBoxes(sourceBoxId, targetBoxId) {
        let boxTmp = this.galleryPZes[sourceBoxId].innerHTML;
        this.galleryPZes[sourceBoxId].innerHTML = this.galleryPZes[targetBoxId].innerHTML;
        this.galleryPZes[targetBoxId].innerHTML = boxTmp;
        
        this.saveStateToLocalStorage();

        this.reloadPreview();
        this.panelFormUpdate();
    },
    setUrlInDomNoscriptTag(elementUpdated, url) {
        const noscriptEl = elementUpdated.previousElementSibling;
        const tmpEl = document.createElement('div');
        tmpEl.innerHTML = noscriptEl.innerText;
        tmpEl.querySelector('img').setAttribute('src', url);
        noscriptEl.innerHTML = tmpEl.innerHTML;
    },
    setUrlsInDomHtml(elementUpdated, boxId, fieldName) {
        if (fieldName === 'img' || fieldName === 'img_hover') {
            elementUpdated.setAttribute('data-src', this.galleryPZData.items[boxId][fieldName]);
            this.setUrlInDomNoscriptTag(elementUpdated, this.galleryPZData.items[boxId][fieldName]);
        }
        if (fieldName === 'link') {
            elementUpdated.setAttribute('href', this.galleryPZData.items[boxId][fieldName]);
        }
    },
    panelFormUpdate(boxId = null, fieldName = null) {
        if(boxId && fieldName) {
            editPanelBoxes[boxId].querySelector(`input[name=${fieldName}]`).value = this.galleryPZData.items[boxId][fieldName];
            return;
        }

        editPanelBoxes.forEach((el, id) => {
            el.querySelector('input[name=link]').value = this.galleryPZData.items[id].link;
            el.querySelector('input[name=img]').value = this.galleryPZData.items[id].img;
            el.querySelector('input[name=img_hover]').value = this.galleryPZData.items[id].img_hover;
        });
    }
}


const dragFuncs = {
    dragSrcEl: false,

    handleStart(e) {
        editPanelBoxes.forEach(function (item) {
            item.classList.remove('over');
        });
     
        this.dragSrcEl = this;
      
        e.dataTransfer.setData('text/plain', this.dataset.boxid);
    },
    handleDrop(e) {
        e.stopPropagation();
        e.preventDefault();
        
        if (this.dragSrcEl !== this) {
            const boxSourceId = parseInt(e.dataTransfer.getData('text/plain'));
            const boxDestId = parseInt(this.dataset.boxid);
            const tmpBoxObj = galleryPZ.galleryPZData.items[boxSourceId];
            galleryPZ.galleryPZData.items[boxSourceId] = galleryPZ.galleryPZData.items[boxDestId];
            galleryPZ.galleryPZData.items[boxDestId] = tmpBoxObj;
            galleryPZ.switchBoxes(boxSourceId, boxDestId);
        }

        this.classList.remove('over');
        
        return false;
    },
    handleEnd(e) {
        e.preventDefault();
        return false;
    },
    handleOver(e) {
        e.preventDefault();
        return false;
    },
    handleEnter(e) {
        if(this.classList.contains('box')) {
            editPanelBoxes.forEach(el => {
                el.classList.remove('over');
            });

            this.classList.add('over');
        }
    },
}

const sliderInit = {
    init() {
        new Glider(document.querySelector('.glider'), {
            slidesToShow: 1.3,
            slidesToScroll: 1,
            draggable: true,
            scrollLock: true,
            arrows: {
                prev: '.glider-prev',
                next: '.glider-next'
            },
            responsive: [{
                breakpoint: 420,
                settings: {
                    slidesToShow: 2.3,
                    itemWidth: 150,
                    duration: 0.25
                }
            },{
                breakpoint: 768,
                settings: {
                    slidesToShow: 4,
                    itemWidth: 150,
                    duration: 0.25
                }
            }]
        });
    }
}

galleryPZ.init();

editPanelInputs.forEach(input => {
    input.addEventListener('change', e => {
        if(e.target.name !== 'box_date')
            galleryPZ.galleryPZUpdate(parseInt(e.target.closest('.box').dataset.boxid), e.target.name, e.target.value);
        else
            galleryPZ.updateDate(e.target.value);
    });

    input.addEventListener('dragstart', e => {
        e.preventDefault();
        e.stopPropagation();
    });
});

editPanelBoxes.forEach(function(item) {
    item.addEventListener('dragstart', dragFuncs.handleStart);
    item.addEventListener('dragover', dragFuncs.handleOver);
    item.addEventListener('dragenter', dragFuncs.handleEnter);
    item.addEventListener('dragend', dragFuncs.handleEnd);
    item.addEventListener('drop', dragFuncs.handleDrop);
});
