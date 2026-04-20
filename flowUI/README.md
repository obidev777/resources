# flowUI

`flowUI` es una librería C# clásica, basada en componentes al estilo Flutter/Flet, para construir apps HTML responsivas en Android y Windows desde C#.

## Enfoque tipo Flutter/Flet

- Árbol de componentes (`Scaffold`, `AppBar`, `Row`, `Column`, `Grid`, `Card`, etc.).
- Composición declarativa por `Child(...)`.
- Tema moderno con `FlowTheme.ApplyModernTheme(app)`.
- Render local con `HttpListener` en `http://127.0.0.1:8080/`.

## Componentes disponibles

### Layout / estructura
- `Scaffold`
- `AppBar`
- `Row`
- `Column`
- `Wrap`
- `Grid`
- `Container`
- `Card`

### Inputs / formularios
- `TextField`
- `NumberField`
- `TextArea`
- `SelectField`
- `CheckBoxField`
- `Slider`
- `Button`

### Data / visual
- `TextBlock`
- `Image`
- `Avatar`
- `Chip`
- `Badge`
- `ProgressBar`
- `ListTile`
- `Canvas2D`
- `FloatingActionButton`

### Tiempo real
- `RealTimeHub` (`flowUI.on`, `flowUI.emit`, `flowUI.bindText`, `data-flow-bind`)

## Inicio rápido

```csharp
UI app = new UI();
FlowTheme.ApplyModernTheme(app);

Scaffold scaffold = new Scaffold("app")
    .AppBar(new AppBar("bar", "Mi App"))
    .Body(new Column("content")
        .Child(new Card("card1")
            .Child(new TextField("name", "Nombre"))
            .Child(new Button("save", "Guardar"))
            .Child(new TextBlock("live", "Esperando...").Attr("data-flow-bind", "status"))))
    .FloatingAction(new FloatingActionButton("fab", "+"));

app.Add(scaffold);
app.RealTime.RegisterChannel("status");

using (HttpRenderHost host = app.StartHttpListener("Mi App", "http://127.0.0.1:8080/"))
{
    Console.ReadLine();
}
```

## App ejemplo completa

`example/FlowUI.ExampleApp/Program.cs` incluye dashboard moderno con:
- AppBar + Scaffold.
- Cards, formularios, chips, badges, lista de actividad.
- Realtime con binding por atributo.
- Canvas 2D listo para juegos.

## Arquitectura para apps reales

1. WebView Android/Windows apuntando a `127.0.0.1:8080`.
2. Backend real por WebSocket/SSE y puente hacia `flowUI.emit(...)`.
3. Crear tus propios componentes especializados por dominio (ERP, CRM, POS, juegos, etc.).
