using System;
using FlowUI;

namespace FlowUI.ExampleApp
{
    internal static class Program
    {
        private static void Main(string[] args)
        {
            UI app = new UI();
            FlowTheme.ApplyModernTheme(app);

            AppBar appBar = new AppBar("mainBar", "flowUI · Componente estilo Flutter/Flet");

            IComponent profileCard = new Card("profileCard")
                .Child(new Row("profileHeader")
                    .Child(new Avatar("avatar", "https://picsum.photos/80"))
                    .Child(new Column("userInfo")
                        .Child(new TextBlock("name", "Usuario Pro"))
                        .Child(new Badge("plan", "PREMIUM"))
                        .Child(new Chip("region", "Android + Windows"))))
                .Child(new ProgressBar("cpu", 72));

            IComponent formCard = new Card("formCard")
                .Child(new TextBlock("formTitle", "Formulario moderno"))
                .Child(new TextField("nameField", "Tu nombre"))
                .Child(new NumberField("ageField", 1, 120))
                .Child(new SelectField("roleField", "Admin", "Editor", "Viewer"))
                .Child(new TextArea("bioField", "Describe tu app..."))
                .Child(new Slider("priority", 0, 100, 35))
                .Child(new CheckBoxField("terms", "Aceptar términos", true));

            IComponent realtimeCard = new Card("realtimeCard")
                .Child(new TextBlock("rtTitle", "Tiempo real"))
                .Child(new Button("emitBtn", "Emitir notificación")
                    .Attr("onclick", "flowUI.emit('notice','Evento #' + Math.floor(Math.random()*9999));"))
                .Child(new TextBlock("liveNotice", "Esperando eventos...").Attr("data-flow-bind", "notice"))
                .Child(new Canvas2D("gameCanvas", 640, 260));

            IComponent grid = new Grid("dashboardGrid", "repeat(2, minmax(0,1fr))")
                .Child(profileCard)
                .Child(formCard)
                .Child(realtimeCard)
                .Child(new Card("activity")
                    .Child(new TextBlock("activityTitle", "Actividad"))
                    .Child(new ListTile("a1", "Inicio de sesión", "Hace 2 minutos"))
                    .Child(new ListTile("a2", "Pago aprobado", "Hace 15 minutos"))
                    .Child(new ListTile("a3", "Deploy Android", "Hace 1 hora")));

            Scaffold scaffold = new Scaffold("app")
                .AppBar(appBar)
                .Body(new Column("bodyCol")
                    .Child(new Wrap("tags")
                        .Child(new Chip("c1", "Realtime"))
                        .Child(new Chip("c2", "Canvas 2D"))
                        .Child(new Chip("c3", "Responsive"))
                        .Child(new Chip("c4", "Components")))
                    .Child(grid))
                .BottomBar(new TextBlock("footer", "flowUI 2026 · Render local por HttpListener"))
                .FloatingAction(new FloatingActionButton("fab", "+ Nuevo"));

            app.Add(scaffold);
            app.RealTime.RegisterChannel("notice");

            app.Canvas
                .CreateScene("gameCanvas")
                .FillBackground("#0a1223")
                .DrawCircle(80f, 130f, 26f, "#4ef0d7")
                .DrawText("Canvas listo para juegos 2D", 20f, 36f, "#ffffff", "20px Segoe UI")
                .DrawText("Animación en tiempo real con requestAnimationFrame", 20f, 236f, "#8bb5ff", "14px Segoe UI");

            using (HttpRenderHost host = app.StartHttpListener("FlowUI Modern App", "http://127.0.0.1:8080/"))
            {
                Console.WriteLine("Servidor activo en http://127.0.0.1:8080/");
                Console.WriteLine("Presiona ENTER para detener.");
                Console.ReadLine();
            }
        }
    }
}
