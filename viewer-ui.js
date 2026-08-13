(function(){
  function makeSectionLabel(text,before){
    if(!before||before.previousElementSibling?.classList?.contains('premium-section')) return;
    const label=document.createElement('div');
    label.className='premium-section';
    label.textContent=text;
    before.parentNode.insertBefore(label,before);
  }

  function initPrivacyWarningToggle(){
    const toggle=document.getElementById('dv-warn-toggle');
    if(!toggle||toggle.dataset.premiumPrivacyToggleBound==='true') return;
    toggle.dataset.premiumPrivacyToggleBound='true';
    toggle.addEventListener('click',function(){
      this.classList.toggle('dv-warn-expanded');
      const chevron=this.querySelector('.dv-warn-chevron');
      if(chevron) chevron.textContent=this.classList.contains('dv-warn-expanded')?'▴':'▾';
    });
  }

  const ICONS={
    pan:'<svg viewBox="0 0 24 24"><path d="M8 11V6.8a1.4 1.4 0 0 1 2.8 0V10 5.4a1.4 1.4 0 0 1 2.8 0V10 6.4a1.4 1.4 0 0 1 2.8 0v4.3-2.2a1.4 1.4 0 0 1 2.8 0v4.9c0 4.3-2.4 7-6.5 7H12c-2 0-3.3-.8-4.5-2.3L4.8 15a1.5 1.5 0 0 1 2.2-2l1 1.1V11Z"/></svg>',
    zoom:'<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="5.8"/><path d="m15 15 5 5M10.5 7.7v5.6M7.7 10.5h5.6"/></svg>',
    window:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.5"/><path d="M12 4.5v15M4.5 12h15"/></svg>',
    invert:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.5"/><path d="M12 4.5a7.5 7.5 0 0 1 0 15Z" fill="currentColor" stroke="none"/></svg>',
    reset:'<svg viewBox="0 0 24 24"><path d="M5.3 8.2A7.8 7.8 0 1 1 4.8 15M5.3 8.2V4.5M5.3 8.2H9"/></svg>',
    rotate:'<svg viewBox="0 0 24 24"><path d="M7 6.8A7.5 7.5 0 1 1 5 15M7 6.8V3.5M7 6.8h3.3"/></svg>',
    flip:'<svg viewBox="0 0 24 24"><path d="M12 4v16M9 7 4.5 12 9 17M15 7l4.5 5-4.5 5"/></svg>',
    arrow:'<svg viewBox="0 0 24 24"><path d="M5 19 19 5M12.8 5H19v6.2"/></svg>',
    length:'<svg viewBox="0 0 24 24"><path d="m5 17 12-12M4 13l7 7M13 4l7 7"/></svg>',
    angle:'<svg viewBox="0 0 24 24"><path d="M5 18 12 6l7 12M8.5 18h7"/></svg>',
    cobb:'<svg viewBox="0 0 24 24"><path d="M4 7h8M12 7l4 10M12 17h8"/></svg>',
    text:'<svg viewBox="0 0 24 24"><path d="M5 6h14M12 6v13M8.5 19h7"/></svg>',
    bone:'<svg viewBox="0 0 24 24"><path d="M8.2 9.2 14.8 15.8M6.7 10.5a2.7 2.7 0 1 1 1.5-4.8 2.8 2.8 0 0 1 4 0l6.1 6.1a2.8 2.8 0 0 1 0 4 2.7 2.7 0 1 1-4.8 1.5"/></svg>',
    soft:'<svg viewBox="0 0 24 24"><path d="M5 16c3-7 11-9 14-8-1 7-6 11-14 8ZM8 14c2-2 4.5-3.4 7.5-4.1"/></svg>',
    fit:'<svg viewBox="0 0 24 24"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/></svg>'
  };

  function normalizeLabel(text){
    return (text||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
  }

  function iconForButton(btn){
    const id=(btn.id||'').toLowerCase();
    const label=normalizeLabel(btn.textContent);
    const candidates=[
      ['pan',['pan','desplazar']],['zoom',['zoom']],['window',['ventana','wl/ww','window']],
      ['invert',['invertir','invert']],['reset',['restablecer','reset']],['rotate',['rotar','rotate']],
      ['flip',['espejo','flip']],['arrow',['flecha','arrow']],['length',['longitud','length','distancia']],
      ['angle',['angulo','angle']],['cobb',['cobb']],['text',['texto','text']],['bone',['oseo','hueso','bone']],
      ['soft',['tejidos blandos','tejido blando','soft']],['fit',['ajustar','fit']]
    ];
    for(const [key,terms] of candidates){
      if(terms.some(term=>id.includes(term.replace(/\s+/g,'-'))||label.includes(term))) return key;
    }
    return null;
  }

  function cleanLegacyGlyphs(btn){
    if(!btn||btn.dataset.premiumLabelCleaned==='true') return;
    const label=(btn.textContent||'').replace(/^[\s↗↻↶↷⟲⟳↔↕✕📏📐🦴👁👤🖥🏷💡]+/u,'').trim();
    if(label && btn.children.length===0) btn.textContent=label;
    btn.dataset.premiumLabelCleaned='true';
  }

  function decorateToolButtons(){
    document.querySelectorAll('#dv-quad-herramientas .dv-btn,#dv-quad-imagen .dv-controls .dv-btn').forEach(btn=>{
      if(btn.dataset.premiumIconBound==='true') return;
      const iconKey=iconForButton(btn);
      if(!iconKey||!ICONS[iconKey]) return;
      cleanLegacyGlyphs(btn);
      const icon=document.createElement('span');
      icon.className='premium-tool-icon';
      icon.setAttribute('aria-hidden','true');
      icon.innerHTML=ICONS[iconKey];
      btn.prepend(icon);
      btn.classList.add('premium-icon-button');
      btn.dataset.premiumIconBound='true';
    });
  }

  function revealTransformGrid(){
    const tools=document.getElementById('dv-quad-herramientas');
    const opener=document.getElementById('dv-transform-opener');
    if(!tools||!opener||document.getElementById('premium-transform-grid')) return;
    const ids=['dv-flip-h','dv-flip-v','dv-rotate-left','dv-rotate-right'];
    const buttons=ids.map(id=>document.getElementById(id)).filter(Boolean);
    if(buttons.length!==4) return;
    const grid=document.createElement('div');
    grid.id='premium-transform-grid';
    grid.className='dv-controls dv-tool-grid premium-transform-grid';
    const labels={
      'dv-flip-h':'Voltear H','dv-flip-v':'Voltear V','dv-rotate-left':'Rotar izq.','dv-rotate-right':'Rotar der.'
    };
    buttons.forEach(btn=>{
      btn.textContent=labels[btn.id];
      btn.dataset.premiumIconBound='false';
      btn.dataset.premiumLabelCleaned='true';
      grid.appendChild(btn);
    });
    const host=opener.closest('.dv-controls');
    if(host){
      host.insertAdjacentElement('afterend',grid);
      host.classList.add('premium-transform-opener-row');
    }
  }

  function ensureStudyStatus(){
    const left=document.querySelector('.dv-left-col');
    const list=document.getElementById('dv-filelist');
    if(!left||!list) return;
    let status=document.getElementById('premium-study-status');
    if(!status){
      status=document.createElement('div');
      status.id='premium-study-status';
      status.className='premium-study-status';
      status.innerHTML='<span class="premium-status-dot" aria-hidden="true"></span><span class="premium-study-count">0 estudio(s) cargado(s)</span>';
      left.appendChild(status);
    }
    const update=()=>{
      const count=list.querySelectorAll('.dv-file-item').length;
      const label=status.querySelector('.premium-study-count');
      if(label) label.textContent=`${count} estudio(s) cargado(s)`;
      status.classList.toggle('has-studies',count>0);
    };
    update();
    if(list.dataset.premiumStatusObserved!=='true'){
      list.dataset.premiumStatusObserved='true';
      new MutationObserver(update).observe(list,{childList:true,subtree:false});
    }
  }

  function applyPremiumDom(){
    const empty=document.getElementById('dv-empty');
    if(empty){
      empty.innerHTML='<div class="premium-ring">⇧</div><div class="premium-title">Cargue un estudio DICOM</div><div class="premium-copy">Arrastra y suelta archivos DICOM aquí<br>o usa el botón de carga en el panel izquierdo.</div>';
    }

    const tools=document.getElementById('dv-quad-herramientas');
    if(tools){
      makeSectionLabel('Marcadores',tools.querySelector('.dv-controls'));
      const transform=document.getElementById('dv-transform-opener');
      if(transform) makeSectionLabel('Transformar',transform.closest('.dv-controls'));
      const arrow=document.getElementById('dv-tool-arrow');
      if(arrow) makeSectionLabel('Medición y anotación',arrow.closest('.dv-controls'));
      const bone=document.getElementById('dv-profile-bone');
      if(bone) makeSectionLabel('Preset',bone.closest('.dv-controls'));
      const view=document.getElementById('dv-view-opener');
      if(view) makeSectionLabel('Vista',view.closest('.dv-controls'));
    }

    revealTransformGrid();
    decorateToolButtons();
    ensureStudyStatus();
    initPrivacyWarningToggle();
  }

  window.imeDicomUi={applyPremiumDom,initPrivacyWarningToggle,decorateToolButtons,ensureStudyStatus,revealTransformGrid};
})();
