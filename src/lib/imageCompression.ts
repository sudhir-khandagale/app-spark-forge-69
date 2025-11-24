export const compressImage = async (file: File, maxSizeKB: number = 200): Promise<File> => {
  const maxSizeBytes = maxSizeKB * 1024;
  
  // If file is already under limit, return as is
  if (file.size <= maxSizeBytes) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        let quality = 0.9;
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        // Start with original dimensions, we'll reduce if needed
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const compressRecursively = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              // If we're under the limit, we're done
              if (blob.size <= maxSizeBytes) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
                return;
              }

              // If quality is still reasonable, reduce it
              if (quality > 0.5) {
                quality -= 0.1;
                compressRecursively();
                return;
              }

              // If quality is too low, reduce dimensions
              width = Math.floor(width * 0.8);
              height = Math.floor(height * 0.8);
              
              // Don't go below minimum dimensions
              if (width < 200 || height < 200) {
                // If we can't compress further, return what we have
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
                return;
              }

              // Reset quality and try with smaller dimensions
              quality = 0.9;
              canvas.width = width;
              canvas.height = height;
              ctx = canvas.getContext('2d');
              if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
              }
              ctx.drawImage(img, 0, 0, width, height);
              compressRecursively();
            },
            'image/jpeg',
            quality
          );
        };

        compressRecursively();
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
