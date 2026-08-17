export default function Media({ src, alt, placeholder = "Photo not added yet" }) {
  if (src) {
    return <img className="media-frame" src={src} alt={alt} />;
  }
  return (
    <div className="media-placeholder">
      <span>🖼️</span>
      <span>{placeholder}</span>
    </div>
  );
}
