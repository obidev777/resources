using System;
using System.Net;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FlowUI
{
    public sealed class HttpRenderHost : IDisposable
    {
        private readonly HttpListener _listener;
        private readonly Func<string> _htmlProvider;
        private readonly string _prefix;
        private CancellationTokenSource _cts;
        private Task _loopTask;

        public HttpRenderHost(Func<string> htmlProvider, string prefix)
        {
            if (htmlProvider == null)
            {
                throw new ArgumentNullException("htmlProvider");
            }

            if (string.IsNullOrWhiteSpace(prefix))
            {
                throw new ArgumentException("prefix no puede ser vacío", "prefix");
            }

            _htmlProvider = htmlProvider;
            _prefix = NormalizePrefix(prefix);
            _listener = new HttpListener();
            _listener.Prefixes.Add(_prefix);
        }

        public string Prefix
        {
            get { return _prefix; }
        }

        public bool IsRunning
        {
            get { return _listener.IsListening; }
        }

        public void Start()
        {
            if (IsRunning)
            {
                return;
            }

            _cts = new CancellationTokenSource();
            _listener.Start();
            _loopTask = Task.Run(delegate { AcceptLoop(_cts.Token); });
        }

        public void Stop()
        {
            if (!IsRunning)
            {
                return;
            }

            _cts.Cancel();
            _listener.Stop();
            if (_loopTask != null)
            {
                _loopTask.Wait(1000);
            }
        }

        private void AcceptLoop(CancellationToken token)
        {
            while (!token.IsCancellationRequested)
            {
                HttpListenerContext context;
                try
                {
                    context = _listener.GetContext();
                }
                catch (HttpListenerException)
                {
                    break;
                }
                catch (ObjectDisposedException)
                {
                    break;
                }

                WriteHtml(context);
            }
        }

        private void WriteHtml(HttpListenerContext context)
        {
            string html = _htmlProvider();
            byte[] bytes = Encoding.UTF8.GetBytes(html);

            context.Response.StatusCode = 200;
            context.Response.ContentType = "text/html; charset=utf-8";
            context.Response.ContentEncoding = Encoding.UTF8;
            context.Response.ContentLength64 = bytes.Length;
            context.Response.OutputStream.Write(bytes, 0, bytes.Length);
            context.Response.OutputStream.Flush();
            context.Response.Close();
        }

        public void Dispose()
        {
            Stop();
            _listener.Close();
            if (_cts != null)
            {
                _cts.Dispose();
            }
        }

        private static string NormalizePrefix(string prefix)
        {
            string normalized = prefix.Trim();
            if (!normalized.EndsWith("/"))
            {
                normalized = normalized + "/";
            }

            if (!normalized.StartsWith("http://") && !normalized.StartsWith("https://"))
            {
                normalized = "http://" + normalized;
            }

            return normalized;
        }
    }
}
