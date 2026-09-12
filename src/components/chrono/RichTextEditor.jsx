import { useMemo, useRef } from 'react';
import { uploadJournalImage } from '@/api/chronoService';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

export default function RichTextEditor({ value, onChange, placeholder }) {
  const quillRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleImage = () => {
    fileInputRef.current?.click();
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fileUrl = await uploadJournalImage(file);
      const quill = quillRef.current?.getEditor?.() || quillRef.current?.editor;
      const range = quill?.getSelection?.(true) || { index: 0, length: 0 };
      quill?.insertEmbed(range.index, 'image', fileUrl);
    } catch (err) {
      console.error('Image upload failed', err);
    }
    e.target.value = '';
  };

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ align: [] }],
          ['blockquote', 'code-block'],
          ['link', 'image'],
          ['clean'],
        ],
        handlers: { image: handleImage },
      },
    }),
    []
  );

  return (
    <div className="chrono-quill">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onFile} />
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
      />
    </div>
  );
}
