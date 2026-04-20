using System.Text;

namespace FlowUI
{
    public sealed class Container : ComponentBase
    {
        public Container(string id) : base(id) { }
        protected override string TagName { get { return "div"; } }
        protected override void RenderContent(StringBuilder html) { }
    }

    public sealed class TextBlock : ComponentBase
    {
        private readonly string _text;
        public TextBlock(string id, string text) : base(id)
        {
            _text = text;
        }

        protected override string TagName { get { return "p"; } }

        protected override void RenderContent(StringBuilder html)
        {
            html.Append(HtmlEncoder.Escape(_text));
        }
    }

    public sealed class Button : ComponentBase
    {
        private readonly string _label;

        public Button(string id, string label) : base(id)
        {
            _label = label;
        }

        protected override string TagName { get { return "button"; } }

        protected override void RenderContent(StringBuilder html)
        {
            html.Append(HtmlEncoder.Escape(_label));
        }
    }

    public sealed class Image : ComponentBase
    {
        public Image(string id, string src, string alt) : base(id)
        {
            Attr("src", src);
            Attr("alt", alt);
        }

        protected override string TagName { get { return "img"; } }
        protected override bool IsSelfClosing { get { return true; } }
        protected override void RenderContent(StringBuilder html) { }
    }

    public sealed class Canvas2D : ComponentBase
    {
        private readonly int _width;
        private readonly int _height;

        public Canvas2D(string id, int width, int height) : base(id)
        {
            _width = width;
            _height = height;
            Attr("width", width.ToString());
            Attr("height", height.ToString());
        }

        protected override string TagName { get { return "canvas"; } }

        protected override void RenderContent(StringBuilder html)
        {
            html.Append("Canvas not supported");
        }
    }
}
