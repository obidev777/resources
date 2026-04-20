using System.Collections.Generic;
using System.Text;

namespace FlowUI
{
    public sealed class RealTimeHub
    {
        private readonly List<string> _channels;

        public RealTimeHub()
        {
            _channels = new List<string>();
        }

        public RealTimeHub RegisterChannel(string channel)
        {
            if (!_channels.Contains(channel))
            {
                _channels.Add(channel);
            }
            return this;
        }

        public string RenderClientScript()
        {
            StringBuilder js = new StringBuilder();
            js.Append("window.flowUI = window.flowUI || {};\n");
            js.Append("flowUI.subscribers = flowUI.subscribers || {};\n");
            js.Append("flowUI.on = function(channel, handler){");
            js.Append("flowUI.subscribers[channel]=flowUI.subscribers[channel]||[];");
            js.Append("flowUI.subscribers[channel].push(handler);};\n");
            js.Append("flowUI.emit = function(channel,payload){var list=flowUI.subscribers[channel]||[];");
            js.Append("for(var i=0;i<list.length;i++){list[i](payload);} };\n");
            js.Append("flowUI.bindText = function(channel, elementId){flowUI.on(channel,function(x){");
            js.Append("var el=document.getElementById(elementId); if(el){el.textContent=x;}});};\n");
            js.Append("flowUI.autoBind = function(){");
            js.Append("var list=document.querySelectorAll('[data-flow-bind]');");
            js.Append("for(var i=0;i<list.length;i++){var el=list[i];var ch=el.getAttribute('data-flow-bind');");
            js.Append("if(ch){flowUI.bindText(ch, el.id);}}};\n");
            js.Append("if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',flowUI.autoBind);}else{flowUI.autoBind();}\n");

            for (int i = 0; i < _channels.Count; i++)
            {
                js.Append("flowUI.subscribers['").Append(_channels[i]).Append("']=flowUI.subscribers['").Append(_channels[i]).Append("']||[];\n");
            }

            return js.ToString();
        }
    }
}
