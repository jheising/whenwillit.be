var BlobBuilder = BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder || function (e) {
    if (navigator.userAgent.indexOf("MSIE") > -1 && navigator.userAgent.indexOf("MSIE 10") == -1) {
        console.log("Unsupported Browser");
        return
    }
    "use strict";
    var t = function (e) {
        return Object.prototype.toString.call(e).match(/^\[object\s(.*)\]$/)[1]
    }, n = function () {
        this.data = []
    }, r = function (e, t, n) {
        this.data = e;
        this.size = e.length;
        this.type = t;
        this.encoding = n
    }, i = n.prototype, s = r.prototype, o = e.FileReaderSync, u = function (e) {
        this.code = this[this.name = e]
    }, a = ("NOT_FOUND_ERR SECURITY_ERR ABORT_ERR NOT_READABLE_ERR ENCODING_ERR " + "NO_MODIFICATION_ALLOWED_ERR INVALID_STATE_ERR SYNTAX_ERR").split(" "), f = a.length, l = e.URL || e.webkitURL || e, c = l.createObjectURL, h = l.revokeObjectURL, p = l, d = e.btoa, v = e.atob, m = false, g = function (e) {
        m = !e
    }, y = e.ArrayBuffer, b = e.Uint8Array;
    n.fake = s.fake = true;
    while (f--) {
        u.prototype[a[f]] = f + 1
    }
    try {
        if (b) {
            g.apply(0, new b(1))
        }
    } catch (w) {
    }
    if (!l.createObjectURL) {
        p = e.URL = {}
    }
    p.createObjectURL = function (e) {
        var t = e.type, n;
        if (t === null) {
            t = "application/octet-stream"
        }
        if (e instanceof r) {
            n = "data:" + t;
            if (e.encoding === "base64") {
                return n + ";base64," + e.data
            } else if (e.encoding === "URI") {
                return n + "," + decodeURIComponent(e.data)
            }
            if (d) {
                return n + ";base64," + d(e.data)
            } else {
                return n + "," + encodeURIComponent(e.data)
            }
        } else if (c) {
            return c.call(l, e)
        }
    };
    p.revokeObjectURL = function (e) {
        if (e.substring(0, 5) !== "data:" && h) {
            h.call(l, e)
        }
    };
    i.append = function (e) {
        var n = this.data;
        if (b && e instanceof y) {
            if (m) {
                n.push(String.fromCharCode.apply(String, new b(e)))
            } else {
                var i = "", s = new b(e), a = 0, f = s.length;
                for (; a < f; a++) {
                    i += String.fromCharCode(s[a])
                }
            }
        } else if (t(e) === "Blob" || t(e) === "File") {
            if (o) {
                var l = new o;
                n.push(l.readAsBinaryString(e))
            } else {
                throw new u("NOT_READABLE_ERR")
            }
        } else if (e instanceof r) {
            if (e.encoding === "base64" && v) {
                n.push(v(e.data))
            } else if (e.encoding === "URI") {
                n.push(decodeURIComponent(e.data))
            } else if (e.encoding === "raw") {
                n.push(e.data)
            }
        } else {
            if (typeof e !== "string") {
                e += ""
            }
            n.push(unescape(encodeURIComponent(e)))
        }
    };
    i.getBlob = function (e) {
        if (!arguments.length) {
            e = null
        }
        return new r(this.data.join(""), e, "raw")
    };
    i.toString = function () {
        return"[object BlobBuilder]"
    };
    s.slice = function (e, t, n) {
        var i = arguments.length;
        if (i < 3) {
            n = null
        }
        return new r(this.data.slice(e, i > 1 ? t : this.data.length), n, this.encoding)
    };
    s.toString = function () {
        return"[object Blob]"
    };
    return n
}(self);
var saveAs = saveAs || navigator.msSaveOrOpenBlob && navigator.msSaveOrOpenBlob.bind(navigator) || function (e) {
    if (navigator.userAgent.indexOf("MSIE") != -1 && navigator.userAgent.indexOf("MSIE 10") == -1) {
        console.log("Unsupported Browser");
        return
    }
    "use strict";
    var t = e.document, n = function () {
        return e.URL || e.webkitURL || e
    }, r = e.URL || e.webkitURL || e, i = t.createElementNS("http://www.w3.org/1999/xhtml", "a"), s = !e.externalHost && "download"in i, o = function (n) {
        var r = t.createEvent("MouseEvents");
        r.initMouseEvent("click", true, false, e, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        n.dispatchEvent(r)
    }, u = e.webkitRequestFileSystem, a = e.requestFileSystem || u || e.mozRequestFileSystem, f = function (t) {
        (e.setImmediate || e.setTimeout)(function () {
            throw t
        }, 0)
    }, l = "application/octet-stream", c = 0, h = [], p = function () {
        var e = h.length;
        while (e--) {
            var t = h[e];
            if (typeof t === "string") {
                r.revokeObjectURL(t)
            } else {
                t.remove()
            }
        }
        h.length = 0
    }, d = function (e, t, n) {
        t = [].concat(t);
        var r = t.length;
        while (r--) {
            var i = e["on" + t[r]];
            if (typeof i === "function") {
                try {
                    i.call(e, n || e)
                } catch (s) {
                    f(s)
                }
            }
        }
    }, v = function (t, r) {
        var f = this, p = t.type, v = false, m, g, y = function () {
            var e = n().createObjectURL(t);
            h.push(e);
            return e
        }, b = function () {
            d(f, "writestart progress write writeend".split(" "))
        }, w = function () {
            if (v || !m) {
                m = y(t)
            }
            if (g) {
                g.location.href = m
            } else {
                window.open(m, "_blank")
            }
            f.readyState = f.DONE;
            b()
        }, E = function (e) {
            return function () {
                if (f.readyState !== f.DONE) {
                    return e.apply(this, arguments)
                }
            }
        }, S = {create: true, exclusive: false}, x;
        f.readyState = f.INIT;
        if (!r) {
            r = "download"
        }
        if (s) {
            m = y(t);
            i.href = m;
            i.download = r;
            o(i);
            f.readyState = f.DONE;
            b();
            return
        }
        if (e.chrome && p && p !== l) {
            x = t.slice || t.webkitSlice;
            t = x.call(t, 0, t.size, l);
            v = true
        }
        if (u && r !== "download") {
            r += ".download"
        }
        if (p === l || u) {
            g = e
        }
        if (!a) {
            w();
            return
        }
        c += t.size;
        a(e.TEMPORARY, c, E(function (e) {
            e.root.getDirectory("saved", S, E(function (e) {
                var n = function () {
                    e.getFile(r, S, E(function (e) {
                        e.createWriter(E(function (n) {
                            n.onwriteend = function (t) {
                                g.location.href = e.toURL();
                                h.push(e);
                                f.readyState = f.DONE;
                                d(f, "writeend", t)
                            };
                            n.onerror = function () {
                                var e = n.error;
                                if (e.code !== e.ABORT_ERR) {
                                    w()
                                }
                            };
                            "writestart progress write abort".split(" ").forEach(function (e) {
                                n["on" + e] = f["on" + e]
                            });
                            n.write(t);
                            f.abort = function () {
                                n.abort();
                                f.readyState = f.DONE
                            };
                            f.readyState = f.WRITING
                        }), w)
                    }), w)
                };
                e.getFile(r, {create: false}, E(function (e) {
                    e.remove();
                    n()
                }), E(function (e) {
                    if (e.code === e.NOT_FOUND_ERR) {
                        n()
                    } else {
                        w()
                    }
                }))
            }), w)
        }), w)
    }, m = v.prototype, g = function (e, t) {
        return new v(e, t)
    };
    m.abort = function () {
        var e = this;
        e.readyState = e.DONE;
        d(e, "abort")
    };
    m.readyState = m.INIT = 0;
    m.WRITING = 1;
    m.DONE = 2;
    m.error = m.onwritestart = m.onprogress = m.onwrite = m.onabort = m.onerror = m.onwriteend = null;
    e.addEventListener("unload", p, false);
    return g
}(self);
download_ics = function (e, t, n, r, i, s, o) {
    var o = typeof o !== "undefined" ? o : ".ics";
    if (navigator.userAgent.indexOf("MSIE") > -1 && navigator.userAgent.indexOf("MSIE 10") == -1) {
        console.log("Unsupported Browser");
        return
    }
    var t = t;
    var n = n;
    var u = r;
    var g = ["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT", "CLASS:PUBLIC", "DESCRIPTION:" + n, "DTSTART:" + i, "DTEND:" + s, "LOCATION:" + u, "SUMMARY;LANGUAGE=en-us:" + t, "TRANSP:TRANSPARENT", "END:VEVENT", "END:VCALENDAR"].join("\n");
    if (navigator.userAgent.indexOf("MSIE 10") > -1) {
        var y = new Blob([g])
    } else {
        var b = new BlobBuilder;
        b.append(g);
        var y = b.getBlob("text/x-vCalendar;charset=" + document.characterSet)
    }
    saveAs(y, e + o)
}