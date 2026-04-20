namespace FlowUI
{
    public interface IComponent
    {
        string Id { get; }
        string Render();
    }
}
