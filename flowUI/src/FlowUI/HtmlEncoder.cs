using System.Text;

namespace FlowUI
{
    public static class HtmlEncoder
    {
        public static string Escape(string value)
        {
            if (value == null)
            {
                return string.Empty;
            }

            StringBuilder result = new StringBuilder(value.Length);
            for (int i = 0; i < value.Length; i++)
            {
                char c = value[i];
                if (c == '&') result.Append("&amp;");
                else if (c == '<') result.Append("&lt;");
                else if (c == '>') result.Append("&gt;");
                else if (c == '"') result.Append("&quot;");
                else if (c == '\'') result.Append("&#39;");
                else result.Append(c);
            }

            return result.ToString();
        }
    }
}
