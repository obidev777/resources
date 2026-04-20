using System;
using System.Collections.Generic;
using System.Text;

namespace FlowUI
{
    public sealed class UI
    {
        private readonly List<IComponent> _components;
        private readonly StyleSheet _globalStyle;
        private readonly RealTimeHub _hub;
        private readonly ResponsiveRules _responsive;
        private readonly CanvasEngine _canvasEngine;

        public UI()
        {
            _components = new List<IComponent>();
            _globalStyle = new StyleSheet();
            _hub = new RealTimeHub();
            _responsive = new ResponsiveRules();
            _canvasEngine = new CanvasEngine();
        }

        public StyleSheet GlobalStyle
        {
            get { return _globalStyle; }
        }

        public ResponsiveRules Responsive
        {
            get { return _responsive; }
        }

        public RealTimeHub RealTime
        {
            get { return _hub; }
        }

        public CanvasEngine Canvas
        {
            get { return _canvasEngine; }
        }

        public UI Add(IComponent component)
        {
            if (component == null)
            {
                throw new ArgumentNullException("component");
            }

            _components.Add(component);
            return this;
        }

        public HttpRenderHost StartHttpListener(string title)
        {
            return StartHttpListener(title, "http://127.0.0.1:8080/");
        }

        public HttpRenderHost StartHttpListener(string title, string prefix)
        {
            HttpRenderHost host = new HttpRenderHost(delegate
            {
                return RenderDocument(title);
            }, prefix);

            host.Start();
            return host;
        }

        public string RenderDocument(string title)
        {
            StringBuilder html = new StringBuilder();
            html.Append("<!doctype html><html><head><meta charset=\"utf-8\" />");
            html.Append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />");
            html.Append("<title>").Append(HtmlEncoder.Escape(title)).Append("</title>");
            html.Append("<style>").Append(_globalStyle.Render());
            html.Append(_responsive.RenderCss()).Append("</style>");
            html.Append("</head><body>");

            for (int i = 0; i < _components.Count; i++)
            {
                html.Append(_components[i].Render());
            }

            html.Append("<script>").Append(_hub.RenderClientScript()).Append("</script>");
            html.Append("<script>").Append(_canvasEngine.RenderClientScript()).Append("</script>");
            html.Append("</body></html>");
            return html.ToString();
        }
    }
}
