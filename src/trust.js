/* ===========================================================
   crew. — Trust-Layer (Report + Block + Suspend-UI)
   ===========================================================
   Sprint 2: Anti-Missbrauchs-Infrastruktur.

   API (alle als window.trustLayer.* aufrufbar):
     openReportModal(targetId, opts)  — zeigt "Melden"-Modal
     openBlockConfirm(targetId, opts) — zeigt "Blockieren"-Bestätigung
     openSafetyMenu(targetId, opts)   — Sheet mit "Melden / Blockieren"
     blockedIds()                     — Set der eigenen Block-IDs (cached)
     refreshBlockedIds()              — neu laden
     isBlocked(id)                    — bool

   Lädt nach: utils.js, fx.js
   Erwartet: window.sb (supabase client) wird vom Inline-Code gesetzt
             window.toast für Feedback, window.user für Self-Check
   =========================================================== */
(function(){
  'use strict';

  const REASONS = [
    { id: 'harassment', t: 'Belästigung / Hass' },
    { id: 'spam',       t: 'Spam / Werbung' },
    { id: 'fake',       t: 'Fake-Profil' },
    { id: 'violence',   t: 'Gewaltandrohung' },
    { id: 'minor',      t: 'Minderjährig' },
    { id: 'other',      t: 'Anderes' }
  ];

  let _blockedIds = null;     /* Set<string> oder null vor erstem Load */
  let _menuEl = null;
  let _modalEl = null;

  function getSb(){ return window.sb || null; }
  function getMyId(){ return (window.user && window.user.id) || null; }
  function getEsc(){ return window.esc || (s => String(s||'')); }
  function getFx(){ return window.FX || {}; }
  function getToast(){ return window.toast || console.log; }

  /* ---------- Block-Cache ---------- */
  async function refreshBlockedIds(){
    const sb = getSb();
    if (!sb) return new Set();
    try{
      const r = await sb.rpc('list_my_blocks');
      const rows = (r && r.data) || [];
      _blockedIds = new Set(rows.map(x => x.blocked_id));
    }catch(e){
      _blockedIds = new Set();
    }
    return _blockedIds;
  }
  function blockedIds(){ return _blockedIds || new Set(); }
  function isBlocked(id){ return _blockedIds ? _blockedIds.has(id) : false; }

  /* ---------- Modal-Helper (lazy DOM) ---------- */
  function ensureBackdrop(){
    let bd = document.getElementById('trustModalBackdrop');
    if (!bd){
      bd = document.createElement('div');
      bd.id = 'trustModalBackdrop';
      bd.style.cssText = 'position:fixed;inset:0;background:rgba(8,5,18,.78);backdrop-filter:blur(8px);z-index:5000;display:none;align-items:flex-end;justify-content:center;padding:0';
      bd.addEventListener('click', e => { if (e.target === bd) close(); });
      document.body.appendChild(bd);
    }
    return bd;
  }
  function close(){
    const bd = document.getElementById('trustModalBackdrop');
    if (bd){ bd.style.display = 'none'; bd.innerHTML = ''; }
    _menuEl = null;
    _modalEl = null;
  }

  function modalCardCss(){
    return 'width:100%;max-width:520px;background:linear-gradient(180deg,#1a1130,#0f0a1f);border:.5px solid rgba(168,140,255,.22);border-radius:24px 24px 0 0;padding:22px 20px 32px;color:#fff;box-shadow:0 -10px 40px rgba(0,0,0,.5)';
  }

  /* ---------- Safety-Sheet (Melden + Blockieren) ---------- */
  function openSafetyMenu(targetId, opts){
    if (!targetId) return;
    if (targetId === getMyId()) {
      getToast()('Das ist dein eigenes Profil', null, null, 'info');
      return;
    }
    opts = opts || {};
    const bd = ensureBackdrop();
    bd.style.display = 'flex';
    const fx = getFx();
    bd.innerHTML = '<div style="' + modalCardCss() + '">'
      + '<div style="text-align:center;margin-bottom:6px">'
      +   '<div style="width:42px;height:5px;background:rgba(168,140,255,.4);border-radius:3px;margin:0 auto 14px"></div>'
      +   '<div style="font-weight:700;font-size:18px">Aktionen</div>'
      +   (opts.targetName ? '<div style="font-size:13px;color:#aaa;margin-top:2px">'+getEsc()(opts.targetName)+'</div>' : '')
      + '</div>'
      + '<button class="trust-act-btn" data-act="report" style="width:100%;display:flex;gap:14px;align-items:center;padding:16px 14px;background:rgba(255,90,90,.08);border:.5px solid rgba(255,90,90,.25);border-radius:14px;color:#fff;font-size:15px;text-align:left;cursor:pointer;margin-bottom:10px">'
      +   '<img class="emo3d" style="width:24px;height:24px" src="'+(fx.warning||'')+'" alt=""/>'
      +   '<div><div style="font-weight:600">Melden</div><div style="font-size:12px;color:#aaa">Verstoß an Mods schicken</div></div>'
      + '</button>'
      + '<button class="trust-act-btn" data-act="block" style="width:100%;display:flex;gap:14px;align-items:center;padding:16px 14px;background:rgba(168,140,255,.06);border:.5px solid rgba(168,140,255,.25);border-radius:14px;color:#fff;font-size:15px;text-align:left;cursor:pointer;margin-bottom:14px">'
      +   '<img class="emo3d" style="width:24px;height:24px" src="'+(fx.locked||'')+'" alt=""/>'
      +   '<div><div style="font-weight:600">Blockieren</div><div style="font-size:12px;color:#aaa">Du siehst nichts mehr von ihm/ihr</div></div>'
      + '</button>'
      + '<button class="trust-cancel" style="width:100%;padding:14px;background:transparent;border:.5px solid rgba(168,140,255,.18);border-radius:14px;color:#aaa;font-size:14px;cursor:pointer">Abbrechen</button>'
      + '</div>';
    _menuEl = bd.firstChild;
    _menuEl.querySelector('.trust-cancel').onclick = close;
    _menuEl.querySelectorAll('.trust-act-btn').forEach(btn => {
      btn.onclick = () => {
        const act = btn.dataset.act;
        close();
        if (act === 'report') openReportModal(targetId, opts);
        else if (act === 'block') openBlockConfirm(targetId, opts);
      };
    });
  }

  /* ---------- Report-Modal ---------- */
  function openReportModal(targetId, opts){
    if (!targetId) return;
    if (targetId === getMyId()) return;
    opts = opts || {};
    const bd = ensureBackdrop();
    bd.style.display = 'flex';
    const reasonsHtml = REASONS.map(r =>
      '<button class="rep-reason" data-rid="'+r.id+'" style="padding:10px 14px;background:rgba(168,140,255,.06);border:.5px solid rgba(168,140,255,.22);border-radius:999px;color:#fff;font-size:13px;cursor:pointer">'+getEsc()(r.t)+'</button>'
    ).join('');
    const fx = getFx();
    bd.innerHTML = '<div style="' + modalCardCss() + '">'
      + '<div style="text-align:center;margin-bottom:14px">'
      +   '<div style="width:42px;height:5px;background:rgba(168,140,255,.4);border-radius:3px;margin:0 auto 14px"></div>'
      +   '<img class="emo3d" style="width:42px;height:42px" src="'+(fx.warning||'')+'" alt=""/>'
      +   '<div style="font-weight:700;font-size:18px;margin-top:6px">Melden</div>'
      +   '<div style="font-size:13px;color:#aaa;margin-top:4px">Was ist passiert?</div>'
      + '</div>'
      + '<div id="repReasons" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;justify-content:center">' + reasonsHtml + '</div>'
      + '<textarea id="repDetails" placeholder="Optional: kurz beschreiben…" rows="3" style="width:100%;padding:12px;background:rgba(168,140,255,.04);border:.5px solid rgba(168,140,255,.22);border-radius:12px;color:#fff;font-size:14px;resize:none;font-family:inherit;margin-bottom:14px"></textarea>'
      + '<div style="display:flex;gap:10px">'
      +   '<button class="trust-cancel" style="flex:1;padding:14px;background:transparent;border:.5px solid rgba(168,140,255,.18);border-radius:14px;color:#aaa;font-size:14px;cursor:pointer">Abbrechen</button>'
      +   '<button id="repSubmit" disabled style="flex:1;padding:14px;background:rgba(255,90,90,.6);border:none;border-radius:14px;color:#fff;font-size:14px;font-weight:600;cursor:pointer;opacity:.5">Senden</button>'
      + '</div>'
      + '</div>';
    _modalEl = bd.firstChild;

    let chosen = null;
    _modalEl.querySelectorAll('.rep-reason').forEach(b => {
      b.onclick = () => {
        chosen = b.dataset.rid;
        _modalEl.querySelectorAll('.rep-reason').forEach(x => {
          x.style.background = 'rgba(168,140,255,.06)';
          x.style.borderColor = 'rgba(168,140,255,.22)';
        });
        b.style.background = 'rgba(255,90,90,.18)';
        b.style.borderColor = 'rgba(255,90,90,.5)';
        const sub = _modalEl.querySelector('#repSubmit');
        sub.disabled = false;
        sub.style.opacity = '1';
        sub.style.background = 'rgb(255,90,90)';
      };
    });
    _modalEl.querySelector('.trust-cancel').onclick = close;
    _modalEl.querySelector('#repSubmit').onclick = async () => {
      if (!chosen) return;
      const sub = _modalEl.querySelector('#repSubmit');
      sub.disabled = true; sub.textContent = 'Wird gesendet…';
      const details = (_modalEl.querySelector('#repDetails').value || '').slice(0, 800);
      try{
        const r = await getSb().rpc('report_user', {
          p_target_id: targetId,
          p_reason: chosen,
          p_details: details,
          p_target_type: opts.targetType || 'user'
        });
        const ok = r && r.data && r.data.ok;
        if (ok){
          close();
          if (r.data.duplicate) {
            getToast()('Bereits gemeldet — Mods sind dran', null, null, 'info');
          } else {
            getToast()('Gemeldet. Danke — Mods schauen es sich an', null, null, 'success');
          }
        } else {
          sub.disabled = false; sub.textContent = 'Senden';
          getToast()('Fehler: ' + ((r && r.data && r.data.err) || 'unbekannt'), null, null, 'warning');
        }
      }catch(e){
        sub.disabled = false; sub.textContent = 'Senden';
        getToast()('Netzwerkfehler', null, null, 'warning');
      }
    };
  }

  /* ---------- Block-Confirm ---------- */
  function openBlockConfirm(targetId, opts){
    if (!targetId) return;
    if (targetId === getMyId()) return;
    opts = opts || {};
    const bd = ensureBackdrop();
    bd.style.display = 'flex';
    const fx = getFx();
    const name = opts.targetName ? getEsc()(opts.targetName) : 'diesen User';
    bd.innerHTML = '<div style="' + modalCardCss() + '">'
      + '<div style="text-align:center;margin-bottom:14px">'
      +   '<div style="width:42px;height:5px;background:rgba(168,140,255,.4);border-radius:3px;margin:0 auto 14px"></div>'
      +   '<img class="emo3d" style="width:42px;height:42px" src="'+(fx.locked||'')+'" alt=""/>'
      +   '<div style="font-weight:700;font-size:18px;margin-top:6px">Blockieren?</div>'
      +   '<div style="font-size:13px;color:#aaa;margin-top:8px;line-height:1.5">'
      +     'Du siehst nichts mehr von ' + name + '.<br/>Keine Nachrichten, keine Map-Pins, keine Crew-Posts.<br/>Du kannst es jederzeit in den Einstellungen rückgängig machen.'
      +   '</div>'
      + '</div>'
      + '<div style="display:flex;gap:10px">'
      +   '<button class="trust-cancel" style="flex:1;padding:14px;background:transparent;border:.5px solid rgba(168,140,255,.18);border-radius:14px;color:#aaa;font-size:14px;cursor:pointer">Abbrechen</button>'
      +   '<button id="blkSubmit" style="flex:1;padding:14px;background:rgb(255,90,90);border:none;border-radius:14px;color:#fff;font-size:14px;font-weight:600;cursor:pointer">Blockieren</button>'
      + '</div>'
      + '</div>';
    _modalEl = bd.firstChild;
    _modalEl.querySelector('.trust-cancel').onclick = close;
    _modalEl.querySelector('#blkSubmit').onclick = async () => {
      const btn = _modalEl.querySelector('#blkSubmit');
      btn.disabled = true; btn.textContent = 'Wird blockiert…';
      try{
        const r = await getSb().rpc('block_user', { p_target_id: targetId });
        const ok = r && r.data && r.data.ok;
        if (ok){
          if (_blockedIds) _blockedIds.add(targetId);
          else await refreshBlockedIds();
          close();
          getToast()('Blockiert. Du siehst nichts mehr von ihm/ihr.', null, null, 'success');
          if (typeof opts.onBlocked === 'function') opts.onBlocked();
        } else {
          btn.disabled = false; btn.textContent = 'Blockieren';
          getToast()('Fehler: ' + ((r && r.data && r.data.err) || 'unbekannt'), null, null, 'warning');
        }
      }catch(e){
        btn.disabled = false; btn.textContent = 'Blockieren';
        getToast()('Netzwerkfehler', null, null, 'warning');
      }
    };
  }

  async function unblock(targetId){
    try{
      const r = await getSb().rpc('unblock_user', { p_target_id: targetId });
      if (r && r.data && r.data.ok){
        if (_blockedIds) _blockedIds.delete(targetId);
        getToast()('Unblockiert', null, null, 'success');
        return true;
      }
    }catch(e){}
    getToast()('Fehler beim Unblock', null, null, 'warning');
    return false;
  }

  /* ---------- Globals ---------- */
  window.trustLayer = {
    openReportModal,
    openBlockConfirm,
    openSafetyMenu,
    refreshBlockedIds,
    blockedIds,
    isBlocked,
    unblock,
    REASONS
  };
})();
