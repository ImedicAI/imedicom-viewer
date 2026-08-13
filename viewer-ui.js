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

    initPrivacyWarningToggle();
  }

  window.imeDicomUi={applyPremiumDom,initPrivacyWarningToggle};
})();
