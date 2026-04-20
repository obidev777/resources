using System.Collections.Generic;
using System.Text;

namespace FlowUI
{
    public sealed class ResponsiveRules
    {
        private readonly List<MediaQuery> _queries;

        public ResponsiveRules()
        {
            _queries = new List<MediaQuery>();
        }

        public ResponsiveRules AddMaxWidthRule(int maxWidth, string selector, string property, string value)
        {
            _queries.Add(new MediaQuery("(max-width:" + maxWidth + "px)", selector, property, value));
            return this;
        }

        public ResponsiveRules AddMinWidthRule(int minWidth, string selector, string property, string value)
        {
            _queries.Add(new MediaQuery("(min-width:" + minWidth + "px)", selector, property, value));
            return this;
        }

        public string RenderCss()
        {
            StringBuilder css = new StringBuilder();
            for (int i = 0; i < _queries.Count; i++)
            {
                MediaQuery query = _queries[i];
                css.Append("@media ").Append(query.Query).Append("{");
                css.Append(query.Selector).Append("{").Append(query.Property).Append(":").Append(query.Value).Append(";}");
                css.Append("}");
            }
            return css.ToString();
        }

        private sealed class MediaQuery
        {
            public readonly string Query;
            public readonly string Selector;
            public readonly string Property;
            public readonly string Value;

            public MediaQuery(string query, string selector, string property, string value)
            {
                Query = query;
                Selector = selector;
                Property = property;
                Value = value;
            }
        }
    }
}
