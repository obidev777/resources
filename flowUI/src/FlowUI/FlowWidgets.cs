using System;
using System.Text;

namespace FlowUI
{
    public sealed class Scaffold : ComponentBase
    {
        private IComponent _appBar;
        private IComponent _body;
        private IComponent _bottomBar;
        private IComponent _floatingAction;

        public Scaffold(string id) : base(id)
        {
            Attr("class", "flow-scaffold");
        }

        public Scaffold AppBar(IComponent component)
        {
            _appBar = component;
            return this;
        }

        public Scaffold Body(IComponent component)
        {
            _body = component;
            return this;
        }

        public Scaffold BottomBar(IComponent component)
        {
            _bottomBar = component;
            return this;
        }

        public Scaffold FloatingAction(IComponent component)
        {
            _floatingAction = component;
            return this;
        }

        protected override string TagName { get { return "div"; } }

        protected override void RenderContent(StringBuilder html)
        {
            if (_appBar != null)
            {
                html.Append("<header class=\"flow-app-slot\">").Append(_appBar.Render()).Append("</header>");
            }

            html.Append("<main class=\"flow-body-slot\">");
            if (_body != null)
            {
                html.Append(_body.Render());
            }
            html.Append("</main>");

            if (_bottomBar != null)
            {
                html.Append("<footer class=\"flow-bottom-slot\">").Append(_bottomBar.Render()).Append("</footer>");
            }

            if (_floatingAction != null)
            {
                html.Append("<div class=\"flow-fab-slot\">").Append(_floatingAction.Render()).Append("</div>");
            }
        }
    }

    public sealed class AppBar : ComponentBase
    {
        private readonly string _title;

        public AppBar(string id, string title) : base(id)
        {
            _title = title;
            Attr("class", "flow-appbar");
        }

        protected override string TagName { get { return "div"; } }

        protected override void RenderContent(StringBuilder html)
        {
            html.Append("<h1 class=\"flow-appbar-title\">").Append(HtmlEncoder.Escape(_title)).Append("</h1>");
        }
    }

    public sealed class Row : ComponentBase
    {
        public Row(string id) : base(id)
        {
            Attr("class", "flow-row");
        }

        protected override string TagName { get { return "div"; } }
        protected override void RenderContent(StringBuilder html) { }
    }

    public sealed class Column : ComponentBase
    {
        public Column(string id) : base(id)
        {
            Attr("class", "flow-column");
        }

        protected override string TagName { get { return "div"; } }
        protected override void RenderContent(StringBuilder html) { }
    }

    public sealed class Wrap : ComponentBase
    {
        public Wrap(string id) : base(id)
        {
            Attr("class", "flow-wrap");
        }

        protected override string TagName { get { return "div"; } }
        protected override void RenderContent(StringBuilder html) { }
    }

    public sealed class Grid : ComponentBase
    {
        public Grid(string id, string columns) : base(id)
        {
            Attr("class", "flow-grid");
            Attr("style", "grid-template-columns:" + columns + ";");
        }

        protected override string TagName { get { return "div"; } }
        protected override void RenderContent(StringBuilder html) { }
    }

    public sealed class Card : ComponentBase
    {
        public Card(string id) : base(id)
        {
            Attr("class", "flow-card");
        }

        protected override string TagName { get { return "section"; } }
        protected override void RenderContent(StringBuilder html) { }
    }

    public sealed class ListTile : ComponentBase
    {
        private readonly string _title;
        private readonly string _subtitle;

        public ListTile(string id, string title, string subtitle) : base(id)
        {
            _title = title;
            _subtitle = subtitle;
            Attr("class", "flow-list-tile");
        }

        protected override string TagName { get { return "div"; } }

        protected override void RenderContent(StringBuilder html)
        {
            html.Append("<div class=\"flow-list-title\">" + HtmlEncoder.Escape(_title) + "</div>");
            html.Append("<div class=\"flow-list-subtitle\">" + HtmlEncoder.Escape(_subtitle) + "</div>");
        }
    }

    public sealed class TextField : ComponentBase
    {
        public TextField(string id, string placeholder) : base(id)
        {
            Attr("class", "flow-input");
            Attr("type", "text");
            Attr("placeholder", placeholder);
        }

        protected override string TagName { get { return "input"; } }
        protected override bool IsSelfClosing { get { return true; } }
        protected override void RenderContent(StringBuilder html) { }
    }

    public sealed class NumberField : ComponentBase
    {
        public NumberField(string id, int min, int max) : base(id)
        {
            Attr("class", "flow-input");
            Attr("type", "number");
            Attr("min", min.ToString());
            Attr("max", max.ToString());
        }

        protected override string TagName { get { return "input"; } }
        protected override bool IsSelfClosing { get { return true; } }
        protected override void RenderContent(StringBuilder html) { }
    }

    public sealed class TextArea : ComponentBase
    {
        private readonly string _value;

        public TextArea(string id, string value) : base(id)
        {
            _value = value;
            Attr("class", "flow-textarea");
        }

        protected override string TagName { get { return "textarea"; } }

        protected override void RenderContent(StringBuilder html)
        {
            html.Append(HtmlEncoder.Escape(_value));
        }
    }

    public sealed class SelectField : ComponentBase
    {
        private readonly string[] _options;

        public SelectField(string id, params string[] options) : base(id)
        {
            _options = options == null ? new string[0] : options;
            Attr("class", "flow-select");
        }

        protected override string TagName { get { return "select"; } }

        protected override void RenderContent(StringBuilder html)
        {
            for (int i = 0; i < _options.Length; i++)
            {
                string option = _options[i];
                html.Append("<option value=\"").Append(HtmlEncoder.Escape(option)).Append("\">");
                html.Append(HtmlEncoder.Escape(option)).Append("</option>");
            }
        }
    }

    public sealed class CheckBoxField : ComponentBase
    {
        private readonly string _label;
        private readonly bool _isChecked;

        public CheckBoxField(string id, string label, bool isChecked) : base(id)
        {
            _label = label;
            _isChecked = isChecked;
            Attr("class", "flow-check");
        }

        protected override string TagName { get { return "label"; } }

        protected override void RenderContent(StringBuilder html)
        {
            html.Append("<input type=\"checkbox\" id=\"").Append(HtmlEncoder.Escape(Id + "_input")).Append("\" ");
            if (_isChecked) html.Append("checked=\"checked\" ");
            html.Append("/><span>").Append(HtmlEncoder.Escape(_label)).Append("</span>");
        }
    }

    public sealed class Slider : ComponentBase
    {
        public Slider(string id, int min, int max, int value) : base(id)
        {
            Attr("class", "flow-slider");
            Attr("type", "range");
            Attr("min", min.ToString());
            Attr("max", max.ToString());
            Attr("value", value.ToString());
        }

        protected override string TagName { get { return "input"; } }
        protected override bool IsSelfClosing { get { return true; } }
        protected override void RenderContent(StringBuilder html) { }
    }

    public sealed class ProgressBar : ComponentBase
    {
        private readonly int _value;

        public ProgressBar(string id, int value) : base(id)
        {
            _value = Math.Max(0, Math.Min(100, value));
            Attr("class", "flow-progress");
        }

        protected override string TagName { get { return "div"; } }

        protected override void RenderContent(StringBuilder html)
        {
            html.Append("<div class=\"flow-progress-value\" style=\"width:").Append(_value).Append("%\"></div>");
        }
    }

    public sealed class Chip : ComponentBase
    {
        private readonly string _text;

        public Chip(string id, string text) : base(id)
        {
            _text = text;
            Attr("class", "flow-chip");
        }

        protected override string TagName { get { return "span"; } }

        protected override void RenderContent(StringBuilder html)
        {
            html.Append(HtmlEncoder.Escape(_text));
        }
    }

    public sealed class Badge : ComponentBase
    {
        private readonly string _text;

        public Badge(string id, string text) : base(id)
        {
            _text = text;
            Attr("class", "flow-badge");
        }

        protected override string TagName { get { return "span"; } }

        protected override void RenderContent(StringBuilder html)
        {
            html.Append(HtmlEncoder.Escape(_text));
        }
    }

    public sealed class Avatar : ComponentBase
    {
        public Avatar(string id, string imageUrl) : base(id)
        {
            Attr("class", "flow-avatar");
            Attr("src", imageUrl);
            Attr("alt", "avatar");
        }

        protected override string TagName { get { return "img"; } }
        protected override bool IsSelfClosing { get { return true; } }
        protected override void RenderContent(StringBuilder html) { }
    }

    public sealed class FloatingActionButton : ComponentBase
    {
        private readonly string _label;

        public FloatingActionButton(string id, string label) : base(id)
        {
            _label = label;
            Attr("class", "flow-fab");
        }

        protected override string TagName { get { return "button"; } }

        protected override void RenderContent(StringBuilder html)
        {
            html.Append(HtmlEncoder.Escape(_label));
        }
    }
}
