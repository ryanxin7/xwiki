import React from 'react';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';

export default function ZoomImage({ src, alt, width }) {
  return (
    <Zoom>
      <img
        src={src}
        alt={alt}
        style={{ width: width || '100%', cursor: 'zoom-in' }}
      />
    </Zoom>
  );
}
