using System.Collections.Generic;
using System.Text;

namespace FlowUI
{
    public abstract class ComponentBase : IComponent
    {
        private readonly Dictionary<string, string> _attributes;
        private readonly List<IComponent> _children;
        private string _inlineStyle;

        protected ComponentBase(string id)
        {
            Id = id;
            _attributes = new Dictionary<string, string>();
            _children = new List<IComponent>();
            _inlineStyle = string.Empty;
        }

        public string Id { get; private set; }

        public ComponentBase Attr(string name, string value)
        {
            _attributes[name] = value;
            return this;
        }

        public ComponentBase Style(string style)
        {
            _inlineStyle = style;
            return this;
        }

        public ComponentBase Child(IComponent child)
        {
            _children.Add(child);
            return this;
        }

        public string Render()
        {
            StringBuilder html = new StringBuilder();
            RenderOpenTag(html);
            RenderContent(html);

            for (int i = 0; i < _children.Count; i++)
            {
                html.Append(_children[i].Render());
            }

            RenderCloseTag(html);
            return html.ToString();
        }

        protected abstract string TagName { get; }
        protected abstract void RenderContent(StringBuilder html);

        protected virtual bool IsSelfClosing
        {
            get { return false; }
        }

        private void RenderOpenTag(StringBuilder html)
        {
            html.Append("<").Append(TagName).Append(" id=\"").Append(HtmlEncoder.Escape(Id)).Append("\"");
            if (_inlineStyle.Length > 0)
            {
                html.Append(" style=\"").Append(HtmlEncoder.Escape(_inlineStyle)).Append("\"");
            }
            foreach (KeyValuePair<string, string> pair in _attributes)
            {
                html.Append(" ").Append(pair.Key).Append("=\"").Append(HtmlEncoder.Escape(pair.Value)).Append("\"");
            }
            if (IsSelfClosing) html.Append(" />");
            else html.Append(">");
        }

        private void RenderCloseTag(StringBuilder html)
        {
            if (!IsSelfClosing)
            {
                html.Append("</").Append(TagName).Append(">");
            }
        }
    }
}
