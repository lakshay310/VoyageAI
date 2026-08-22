// src/components/StarRating.jsx
// Reusable star rating component.
// Two modes:
//   - Interactive (onClick provided): user can click to set a rating
//   - Display-only (no onClick):      shows a static rating bar

const StarRating = ({ value = 0, onChange, size = 'md' }) => {
  const sizes = { sm: 'text-base', md: 'text-xl', lg: 'text-3xl' };
  const isInteractive = typeof onChange === 'function';

  return (
    <div className="flex items-center gap-0.5" role={isInteractive ? 'radiogroup' : 'img'}
         aria-label={`Rating: ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!isInteractive}
          onClick={() => isInteractive && onChange(star)}
          className={`${sizes[size]} leading-none transition-transform duration-100
                      ${isInteractive ? 'cursor-pointer hover:scale-125' : 'cursor-default'}
                      ${star <= value ? 'text-yellow-400' : 'text-gray-600'}`}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
};

export default StarRating;
