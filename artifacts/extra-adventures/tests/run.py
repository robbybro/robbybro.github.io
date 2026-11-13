#!/usr/bin/env python3
"""Run tests/header_probe.html in headless Chrome and print its table.

Two passes: the page as is, then with Chrome forced to prefers-reduced-motion. Exit code 0 only if every
check in both passed. The probe runs in real time (it watches the load animation play), so a run takes
about a minute. It serves the artifact folder itself on a free local port and the probe posts its table back.

Needs Google Chrome (CHROME=/path/to/chrome to override), outside any sandbox that blocks it.
--headless=new because the old mode delivers no animation frames or scroll events to a page it is not painting.
picsum.photos (the placeholder photos) is pointed at a dead port so a slow third party cannot stall the run.

Run:  python3 tests/run.py
"""
import functools, http.server, os, pathlib, re, shutil, subprocess, sys, tempfile, threading, time

ROOT = pathlib.Path(__file__).resolve().parent.parent
CHROME = os.environ.get("CHROME", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
TIMEOUT = 180
posted = {}


class Handler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        posted[self.path] = self.rfile.read(int(self.headers.get("Content-Length", 0))).decode("utf-8")
        self.send_response(204)
        self.end_headers()

    def log_message(self, *args):
        pass


def one_pass(port, query, *flags):
    key = "/result" + query.replace("?", "-")
    profile = tempfile.mkdtemp(prefix="probe-")
    chrome = subprocess.Popen(
        [CHROME, "--headless=new", "--no-first-run", "--no-default-browser-check", f"--user-data-dir={profile}",
         "--remote-debugging-port=0", "--window-size=1600,1200", "--host-resolver-rules=MAP picsum.photos 127.0.0.1:9",
         *flags, f"http://127.0.0.1:{port}/tests/header_probe.html{query}"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    deadline = time.time() + TIMEOUT
    while key not in posted and time.time() < deadline and chrome.poll() is None:
        time.sleep(0.25)
    chrome.kill()
    chrome.wait()
    shutil.rmtree(profile, ignore_errors=True)
    text = posted.get(key, "RESULT 0 passed, 1 failed (the probe never reported: Chrome missing, blocked, or timed out)")
    print(text)
    return bool(re.search(r"RESULT \d+ passed, 0 failed", text))


def main():
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Handler, directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    port = server.server_address[1]
    ok = one_pass(port, "")
    ok = one_pass(port, "?reduced", "--force-prefers-reduced-motion") and ok
    server.shutdown()
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
