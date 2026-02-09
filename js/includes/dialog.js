(function () {
    function esc(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function ensureModal() {
        var el = document.getElementById('gssDialogModal');
        if (el) return el;

        var wrapper = document.createElement('div');
        wrapper.innerHTML = ''
            + '<div class="modal fade" id="gssDialogModal" tabindex="-1" aria-hidden="true">'
            + '  <div class="modal-dialog modal-dialog-centered">'
            + '    <div class="modal-content" style="border-radius:16px; overflow:hidden;">'
            + '      <div class="modal-header" style="border-bottom:1px solid rgba(148,163,184,0.25);">'
            + '        <h5 class="modal-title" id="gssDialogTitle" style="font-size:14px; font-weight:700;"></h5>'
            + '        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>'
            + '      </div>'
            + '      <div class="modal-body" id="gssDialogBody" style="font-size:13px; color:#334155;"></div>'
            + '      <div class="modal-footer" style="border-top:1px solid rgba(148,163,184,0.25);">'
            + '        <button type="button" class="btn btn-sm btn-light" id="gssDialogCancel" data-bs-dismiss="modal" style="border-radius:10px;">Cancel</button>'
            + '        <button type="button" class="btn btn-sm" id="gssDialogOk" style="border-radius:10px; background:#2563eb; border:1px solid rgba(37,99,235,0.25); color:white; font-weight:600;">OK</button>'
            + '      </div>'
            + '    </div>'
            + '  </div>'
            + '</div>';

        document.body.appendChild(wrapper.firstChild);
        return document.getElementById('gssDialogModal');
    }

    function getModalApi(el) {
        if (!el) return null;
        if (window.bootstrap && typeof window.bootstrap.Modal === 'function') {
            return window.bootstrap.Modal.getOrCreateInstance(el);
        }
        return null;
    }

    function setText(id, text) {
        var el = document.getElementById(id);
        if (!el) return;
        el.textContent = String(text || '');
    }

    function setHtml(id, html) {
        var el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = String(html || '');
    }

    function once(el, eventName, handler) {
        if (!el) return;
        var fn = function (e) {
            try {
                el.removeEventListener(eventName, fn);
            } catch (e2) {
            }
            handler(e);
        };
        el.addEventListener(eventName, fn);
    }

    function setBtnStyle(btn, variant) {
        if (!btn) return;
        if (variant === 'danger') {
            btn.style.background = '#ef4444';
            btn.style.border = '1px solid rgba(239,68,68,0.25)';
            btn.style.color = 'white';
            return;
        }
        if (variant === 'success') {
            btn.style.background = '#16a34a';
            btn.style.border = '1px solid rgba(22,163,74,0.25)';
            btn.style.color = 'white';
            return;
        }
        btn.style.background = '#2563eb';
        btn.style.border = '1px solid rgba(37,99,235,0.25)';
        btn.style.color = 'white';
    }

    function showDialog(options) {
        var opts = options && typeof options === 'object' ? options : {};
        var title = typeof opts.title === 'string' ? opts.title : '';
        var message = typeof opts.message === 'string' ? opts.message : '';
        var htmlMessage = typeof opts.html === 'string' ? opts.html : '';
        var okText = typeof opts.okText === 'string' ? opts.okText : 'OK';
        var cancelText = typeof opts.cancelText === 'string' ? opts.cancelText : 'Cancel';
        var showCancel = !!opts.showCancel;
        var okVariant = typeof opts.okVariant === 'string' ? opts.okVariant : 'primary';

        var modalEl = ensureModal();
        var modalApi = getModalApi(modalEl);
        if (!modalEl || !modalApi) {
            return Promise.resolve(false);
        }

        setText('gssDialogTitle', title);
        if (htmlMessage) {
            setHtml('gssDialogBody', htmlMessage);
        } else {
            setHtml('gssDialogBody', esc(message));
        }

        var okBtn = document.getElementById('gssDialogOk');
        var cancelBtn = document.getElementById('gssDialogCancel');

        if (okBtn) okBtn.textContent = okText;
        if (cancelBtn) cancelBtn.textContent = cancelText;
        if (cancelBtn) cancelBtn.style.display = showCancel ? '' : 'none';
        setBtnStyle(okBtn, okVariant);

        return new Promise(function (resolve) {
            var resolved = false;
            function done(v) {
                if (resolved) return;
                resolved = true;
                resolve(!!v);
            }

            if (okBtn) {
                okBtn.onclick = function () {
                    done(true);
                    modalApi.hide();
                };
            }
            if (cancelBtn) {
                cancelBtn.onclick = function () {
                    done(false);
                };
            }

            once(modalEl, 'hidden.bs.modal', function () {
                done(false);
            });

            modalApi.show();
        });
    }

    window.GSSDialog = {
        alert: function (message, options) {
            var opts = options && typeof options === 'object' ? options : {};
            return showDialog({
                title: typeof opts.title === 'string' ? opts.title : 'Message',
                message: String(message || ''),
                okText: typeof opts.okText === 'string' ? opts.okText : 'OK',
                showCancel: false,
                okVariant: typeof opts.okVariant === 'string' ? opts.okVariant : 'primary'
            });
        },
        confirm: function (message, options) {
            var opts = options && typeof options === 'object' ? options : {};
            return showDialog({
                title: typeof opts.title === 'string' ? opts.title : 'Confirm',
                message: String(message || ''),
                okText: typeof opts.okText === 'string' ? opts.okText : 'OK',
                cancelText: typeof opts.cancelText === 'string' ? opts.cancelText : 'Cancel',
                showCancel: true,
                okVariant: typeof opts.okVariant === 'string' ? opts.okVariant : 'danger'
            });
        }
    };
})();
