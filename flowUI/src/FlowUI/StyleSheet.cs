using System.Collections.Generic;
using System.Text;

namespace FlowUI
{
    public sealed class StyleSheet
    {
        private readonly Dictionary<string, Dictionary<string, string> > _rules;

        public StyleSheet()
        {
            _rules = new Dictionary<string, Dictionary<string, string> >();
        }

        public StyleSheet Rule(string selector, string property, string value)
        {
            Dictionary<string, string> declarations;
            if (!_rules.TryGetValue(selector, out declarations))
            {
                declarations = new Dictionary<string, string>();
                _rules[selector] = declarations;
            }

            declarations[property] = value;
            return this;
        }

        public string Render()
        {
            StringBuilder css = new StringBuilder();
            foreach (KeyValuePair<string, Dictionary<string, string> > pair in _rules)
            {
                css.Append(pair.Key).Append("{");
                foreach (KeyValuePair<string, string> declaration in pair.Value)
                {
                    css.Append(declaration.Key).Append(":").Append(declaration.Value).Append(";");
                }
                css.Append("}");
            }
            return css.ToString();
        }
    }
}
