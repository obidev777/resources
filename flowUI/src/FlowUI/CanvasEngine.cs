using System.Collections.Generic;
using System.Text;

namespace FlowUI
{
    public sealed class CanvasEngine
    {
        private readonly List<CanvasScene> _scenes;

        public CanvasEngine()
        {
            _scenes = new List<CanvasScene>();
        }

        public CanvasScene CreateScene(string canvasId)
        {
            CanvasScene scene = new CanvasScene(canvasId);
            _scenes.Add(scene);
            return scene;
        }

        public string RenderClientScript()
        {
            StringBuilder js = new StringBuilder();
            js.Append("window.flowUICanvas = window.flowUICanvas || {};\n");
            js.Append("flowUICanvas.start = function(canvasId, draw){");
            js.Append("var canvas=document.getElementById(canvasId);if(!canvas){return;}var ctx=canvas.getContext('2d');");
            js.Append("var last=performance.now(); function loop(now){var dt=(now-last)/1000; last=now;");
            js.Append("ctx.clearRect(0,0,canvas.width,canvas.height); draw(ctx,dt,now/1000);");
            js.Append("requestAnimationFrame(loop);} requestAnimationFrame(loop);};\n");

            for (int i = 0; i < _scenes.Count; i++)
            {
                js.Append(_scenes[i].RenderScript());
            }

            return js.ToString();
        }
    }

    public sealed class CanvasScene
    {
        private readonly string _canvasId;
        private readonly List<string> _commands;

        public CanvasScene(string canvasId)
        {
            _canvasId = canvasId;
            _commands = new List<string>();
        }

        public CanvasScene FillBackground(string color)
        {
            _commands.Add("ctx.fillStyle='" + color + "';ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);");
            return this;
        }

        public CanvasScene DrawCircle(float x, float y, float radius, string color)
        {
            _commands.Add("ctx.beginPath();ctx.arc(" + x + "," + y + "," + radius + ",0,Math.PI*2);ctx.fillStyle='" + color + "';ctx.fill();");
            return this;
        }

        public CanvasScene DrawText(string text, float x, float y, string color, string font)
        {
            _commands.Add("ctx.fillStyle='" + color + "';ctx.font='" + font + "';ctx.fillText('" + EscapeJs(text) + "'," + x + "," + y + ");");
            return this;
        }

        public string RenderScript()
        {
            StringBuilder js = new StringBuilder();
            js.Append("flowUICanvas.start('").Append(_canvasId).Append("', function(ctx, dt, t){");
            for (int i = 0; i < _commands.Count; i++)
            {
                js.Append(_commands[i]);
            }
            js.Append("});\n");
            return js.ToString();
        }

        private static string EscapeJs(string value)
        {
            if (value == null) return string.Empty;
            return value.Replace("\\", "\\\\").Replace("'", "\\'");
        }
    }
}
