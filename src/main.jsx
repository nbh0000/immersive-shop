import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const asset = (path) => `${import.meta.env.BASE_URL}assets/${path}`;

const products = [
  {
    id: '01',
    name: 'Play Cardigan',
    category: 'KNIT / 01',
    material: 'soft cotton knit',
    accent: '#c4a16d',
    tone: 'amber',
    price: 'KRW 148,000',
    image: asset('play-cardigan-product.png'),
    modelImage: asset('play-cardigan-model.png'),
    description: 'A warm everyday layer with a quiet character stitched into the chest.',
    details: ['Camel brown knit', 'Ribbed collar, cuff and hem', 'Relaxed unisex fit'],
    sizes: ['S', 'M', 'L'],
  },
  { id: '02', name: 'Nacre Form', category: 'OBJECT / 02', material: 'pearl resin', accent: '#f4c8bd', tone: 'rose', price: '₩ 312,000' },
  { id: '03', name: 'Nocturne Arc', category: 'OBJECT / 03', material: 'black chrome', accent: '#d6d9e6', tone: 'silver', price: '₩ 428,000' },
  { id: '04', name: 'Morrow Vessel', category: 'OBJECT / 04', material: 'warm ceramic', accent: '#eab58a', tone: 'amber', price: '₩ 186,000' },
  { id: '05', name: 'Solace Fold', category: 'OBJECT / 05', material: 'soft metal', accent: '#b8d8c9', tone: 'mint', price: '₩ 274,000' },
];

const chapters = [
  { label: '01 / MATERIAL', title: 'Before the object', copy: 'A quiet room of mineral, air and raw fiber.' },
  { label: '02 / GROWTH', title: 'What the cloth remembers', copy: 'Flax, cotton and ramie moving through the light.' },
  { label: '03 / FORM', title: 'Objects in motion', copy: 'Five useful forms, held inside one slow atmosphere.' },
];

const panoramaTiles = Array.from({ length: 5 }, (_, index) => asset(`panorama/panorama-${String(index + 1).padStart(2, '0')}.webp`));

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const pseudoRandom = (seed) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};

function AtmosphereCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frameId;
    let width = 0;
    let height = 0;
    let time = 0;
    let lastDraw = 0;
    let particles = [];

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.min(36, Math.floor((width * height) / 36000));
      particles = Array.from({ length: count }, (_, index) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random(),
        seed: index * 0.73 + Math.random(),
      }));
    };

    const draw = (now) => {
      if (now - lastDraw < 33) {
        frameId = window.requestAnimationFrame(draw);
        return;
      }
      lastDraw = now;
      time += media.matches ? 0.001 : 0.006;
      context.clearRect(0, 0, width, height);
      const gradient = context.createRadialGradient(width * 0.5, height * 0.43, 0, width * 0.5, height * 0.43, width * 0.62);
      gradient.addColorStop(0, 'rgba(64, 95, 158, .085)');
      gradient.addColorStop(.5, 'rgba(40, 53, 90, .03)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      particles.forEach((particle) => {
        const depth = 0.2 + particle.z * 0.8;
        const x = particle.x + Math.sin(time * 1.1 + particle.seed) * 22 * depth;
        const y = particle.y + Math.cos(time * .75 + particle.seed * 1.4) * 16 * depth;
        const size = (0.45 + particle.z * 1.7) * (width < 700 ? .72 : 1);
        const alpha = 0.06 + particle.z * 0.2;
        context.beginPath();
        context.fillStyle = `rgba(187, 210, 255, ${alpha})`;
        context.arc(x, y, size, 0, Math.PI * 2);
        context.fill();
      });

      frameId = window.requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    frameId = window.requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="atmosphere-canvas" aria-hidden="true" />;
}

function PointerInkCanvas({ pointerRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const drops = [];
    let width = 0;
    let height = 0;
    let frameId;
    let lastTime = performance.now();

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const addDrop = (sample) => {
      const energy = clamp(sample.energy, 0.45, 1.6);
      drops.push({
        x: sample.x,
        y: sample.y,
        vx: sample.vx * 0.8,
        vy: sample.vy * 0.8,
        age: 0,
        duration: 900 + energy * 520,
        maxRadius: (54 + energy * 52) / Math.max(Math.min(width, height) / 900, 0.72),
        alpha: 0.28 + energy * 0.14,
        rotation: Math.atan2(sample.vy, sample.vx) + (sample.x * 9.7) % 1.2,
        seed: sample.x * 41 + sample.y * 17,
      });

      if (drops.length > 34) drops.splice(0, drops.length - 34);
    };

    const drawDrop = (drop) => {
      const progress = clamp(drop.age / drop.duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const fade = Math.pow(1 - progress, 0.72);
      const radius = drop.maxRadius * (0.1 + eased * 0.9);
      const x = (drop.x + drop.vx * eased * 0.018) * width;
      const y = (drop.y + drop.vy * eased * 0.018) * height;
      const pulse = Math.sin(drop.seed + progress * Math.PI * 4) * 0.06;

      context.save();
      context.translate(x, y);
      context.rotate(drop.rotation);
      context.scale(1.08 + pulse, 0.74 - pulse * 0.35);
      context.globalAlpha = drop.alpha * fade;
      context.filter = `blur(${(1.6 + eased * 2.4).toFixed(1)}px)`;

      const ink = context.createRadialGradient(0, 0, 0, 0, 0, radius);
      ink.addColorStop(0, 'rgba(4, 7, 16, .78)');
      ink.addColorStop(.34, 'rgba(17, 23, 43, .58)');
      ink.addColorStop(.68, 'rgba(83, 108, 163, .28)');
      ink.addColorStop(1, 'rgba(93, 116, 168, 0)');
      context.fillStyle = ink;
      context.beginPath();
      const segments = 9;
      for (let index = 0; index < segments; index += 1) {
        const angle = (Math.PI * 2 * index) / segments;
        const variation = 0.78 + (Math.sin(drop.seed * 3.1 + index * 2.4) + 1) * 0.09;
        const pointX = Math.cos(angle) * radius * variation;
        const pointY = Math.sin(angle) * radius * (0.56 + pulse) * variation;
        if (index === 0) context.moveTo(pointX, pointY);
        else context.lineTo(pointX, pointY);
      }
      context.closePath();
      context.fill();

      context.restore();
    };

    const draw = (now) => {
      const delta = Math.min(now - lastTime, 50);
      lastTime = now;

      if (!media.matches) {
        const samples = pointerRef.current.samples.splice(0);
        samples.forEach(addDrop);
        context.clearRect(0, 0, width, height);
        drops.forEach((drop) => {
          drop.age += delta;
          if (drop.age < drop.duration) drawDrop(drop);
        });
        for (let index = drops.length - 1; index >= 0; index -= 1) {
          if (drops[index].age >= drops[index].duration) drops.splice(index, 1);
        }
      } else {
        pointerRef.current.samples.length = 0;
        context.clearRect(0, 0, width, height);
      }

      frameId = window.requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    frameId = window.requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(frameId);
    };
  }, [pointerRef]);

  return <canvas ref={canvasRef} className="pointer-ink-canvas" aria-hidden="true" />;
}

function ProductObject({ tone }) {
  return (
    <div className={`product-object product-object--${tone}`} aria-hidden="true">
      <div className="product-object__halo" />
      <div className="product-object__shadow" />
      <div className="product-object__body">
        <div className="product-object__face" />
        <div className="product-object__edge" />
      </div>
    </div>
  );
}

function ProductMedia({ product, side, style, onOpen }) {
  return (
    <article className={`product-media product-media--${side} ${product.image ? 'product-media--static' : ''}`} style={style}>
      <button
        type="button"
        className={`product-media__frame ${product.image ? 'is-clickable' : ''}`}
        onClick={() => product.image && onOpen(product)}
        disabled={!product.image}
        aria-label={product.image ? `Open ${product.name} details` : undefined}
      >
        <div className="product-media__noise" />
        <div className="product-media__label">
          <span>{product.category}</span>
          <span>{side === 'left' ? 'MOTION STUDY' : 'DETAIL / 360'}</span>
        </div>
        {product.image && side === 'left' ? (
          <img className="product-media__photo" src={product.image} alt={`${product.name} product photograph`} />
        ) : (
          <ProductObject tone={product.tone} />
        )}
        <div className="product-media__line" />
      </button>
      <div className="product-media__caption">
        <strong>{product.name}</strong>
        <span>{product.material}</span>
      </div>
    </article>
  );
}

function WorldTrack({ modifier = '', progress }) {
  return (
    <div className={`world-track-viewport ${modifier}`} aria-hidden="true">
      <div className="world-track" style={{ '--world-progress': progress }}>
        {panoramaTiles.map((source, index) => (
          <div
            className="world-tile"
            key={`${modifier}-${source}`}
            style={{ '--tile-index': index, '--tile-delay': `${index * -2.8}s`, backgroundImage: `url("${source}")` }}
          />
        ))}
      </div>
    </div>
  );
}

function ProductDetailOverlay({ product, detailReady, checkoutStep, selectedSize, onSizeChange, onClose, onAddToBag, onStartCheckout, onSubmitCheckout }) {
  if (!product) return null;

  return (
    <div className={`product-detail ${detailReady ? 'is-ready' : ''} ${checkoutStep === 'checkout' ? 'is-checkout' : ''}`} role="dialog" aria-modal="true" aria-label={`${product.name} product details`}>
      <div className="product-detail__backdrop" onClick={onClose} />
      <div className="product-detail__shell">
        <button type="button" className="product-detail__close" onClick={onClose} aria-label="Close product details">Close <span>×</span></button>

        <div className="product-detail__visual">
          <div className="product-detail__product-echo">
            <img src={product.image} alt="" />
          </div>
          <img className="product-detail__model" src={product.modelImage} alt={`${product.name} worn by a model`} />
          <div className="product-detail__visual-meta">
            <span>THE OBJECT / 01</span>
            <span>WORN STUDY</span>
          </div>
        </div>

        <section className="product-detail__panel">
          {checkoutStep === 'checkout' ? (
            <form className="checkout-form" onSubmit={onSubmitCheckout}>
              <span className="product-detail__kicker">SECURE CHECKOUT</span>
              <h2>Complete<br /><em>the order.</em></h2>
              <label>EMAIL<input name="email" type="email" placeholder="you@example.com" required /></label>
              <label>NAME<input name="name" type="text" placeholder="Your name" required /></label>
              <label>CARD NUMBER<input name="card" inputMode="numeric" placeholder="0000 0000 0000 0000" minLength="12" required /></label>
              <div className="checkout-form__row">
                <label>EXPIRY<input name="expiry" placeholder="MM / YY" required /></label>
                <label>CVC<input name="cvc" inputMode="numeric" placeholder="000" minLength="3" required /></label>
              </div>
              <button className="product-detail__primary" type="submit">Pay {product.price}<span>→</span></button>
              <button className="product-detail__text-button" type="button" onClick={onClose}>Cancel</button>
            </form>
          ) : checkoutStep === 'complete' ? (
            <div className="checkout-complete">
              <span className="product-detail__kicker">ORDER RECEIVED</span>
              <h2>Held<br /><em>for you.</em></h2>
              <p>Your order is ready to move through the studio. A confirmation will arrive by email.</p>
              <button className="product-detail__primary" type="button" onClick={onClose}>Return to collection <span>→</span></button>
            </div>
          ) : (
            <div className="product-detail__content">
              <span className="product-detail__kicker">KNIT / 01 — PLAY</span>
              <h2>{product.name.split(' ')[0]}<br /><em>{product.name.split(' ').slice(1).join(' ')}.</em></h2>
              <p className="product-detail__description">{product.description}</p>
              <div className="product-detail__price-row"><strong>{product.price}</strong><span>MADE TO ORDER / 04 AVAILABLE</span></div>
              <div className="product-detail__options">
                <span>SELECT SIZE</span>
                <div>{product.sizes.map((size) => <button key={size} type="button" className={selectedSize === size ? 'is-selected' : ''} onClick={() => onSizeChange(size)}>{size}</button>)}</div>
              </div>
              <ul className="product-detail__details">{product.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
              <div className="product-detail__actions">
                <button className="product-detail__primary" type="button" onClick={onStartCheckout}>Buy now <span>→</span></button>
                <button className="product-detail__secondary" type="button" onClick={onAddToBag}>Add to bag</button>
              </div>
              <p className="product-detail__note">Free studio delivery · Returns within 14 days</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function App() {
  const sceneRef = useRef(null);
  const stickyRef = useRef(null);
  const pointerMotionFrameRef = useRef(null);
  const pointerMotionRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const pointerRevealTrailRef = useRef([]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [pointerActive, setPointerActive] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailReady, setDetailReady] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('detail');
  const [selectedSize, setSelectedSize] = useState('M');
  const [bagCount, setBagCount] = useState(0);

  useEffect(() => {
    if (!selectedProduct) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const revealTimer = window.setTimeout(() => setDetailReady(true), 680);
    return () => {
      window.clearTimeout(revealTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedProduct]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') setSelectedProduct(null);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const openProduct = (product) => {
    setSelectedProduct(product);
    setSelectedSize(product.sizes?.[1] || product.sizes?.[0] || 'M');
    setCheckoutStep('detail');
    setDetailReady(false);
  };

  const closeProduct = () => {
    setDetailReady(false);
    setSelectedProduct(null);
    setCheckoutStep('detail');
  };

  const addToBag = () => {
    setBagCount((count) => count + 1);
    setCheckoutStep('checkout');
  };

  const startCheckout = () => setCheckoutStep('checkout');

  const submitCheckout = (event) => {
    event.preventDefault();
    setCheckoutStep('complete');
  };

  const renderPointerMotion = () => {
    const sticky = stickyRef.current;
    if (!sticky) return;

    const now = performance.now();
    const revealPoints = pointerRevealTrailRef.current.filter((point) => now - point.time < point.life);
    pointerRevealTrailRef.current = revealPoints;
    const revealMask = revealPoints.map((point) => {
      const age = clamp((now - point.time) / point.life);
      const fade = Math.pow(1 - age, 1.16);
      const wobbleX = Math.sin(now * 0.0042 + point.seed) * point.wanderX * (1 - age);
      const wobbleY = Math.cos(now * 0.0034 + point.seed * 1.3) * point.wanderY * (1 - age);
      const x = point.x + wobbleX;
      const y = point.y + wobbleY;
      const bleedWidth = point.width * (1.7 + age * 0.45);
      const bleedHeight = point.height * (1.65 + age * 0.4);
      const coreWidth = point.width * (1 + age * 0.22);
      const coreHeight = point.height * (1 + age * 0.2);
      return [
        `radial-gradient(ellipse ${bleedWidth.toFixed(2)}% ${bleedHeight.toFixed(2)}% at ${x.toFixed(2)}% ${y.toFixed(2)}%, rgba(0, 0, 0, ${(fade * 0.24).toFixed(3)}) 0%, rgba(0, 0, 0, ${(fade * 0.12).toFixed(3)}) 50%, transparent 100%)`,
        `radial-gradient(ellipse ${coreWidth.toFixed(2)}% ${coreHeight.toFixed(2)}% at ${(x - 0.45).toFixed(2)}% ${(y + 0.3).toFixed(2)}%, rgba(0, 0, 0, ${(fade * 0.92).toFixed(3)}) 0%, rgba(0, 0, 0, ${(fade * 0.64).toFixed(3)}) 42%, rgba(0, 0, 0, ${(fade * 0.16).toFixed(3)}) 76%, transparent 100%)`,
      ].join(', ');
    }).join(', ');
    sticky.style.setProperty(
      '--pointer-reveal-mask',
      revealMask || 'radial-gradient(ellipse 0% 0% at 50% 50%, transparent 0%, transparent 100%)',
    );

    const motion = pointerMotionRef.current;
    motion.x += (motion.targetX - motion.x) * 0.12;
    motion.y += (motion.targetY - motion.y) * 0.12;
    sticky.querySelectorAll('.world-track').forEach((track, index) => {
      const depth = index === 0 ? 0.22 : 0.92;
      const revealWobbleX = index === 1 ? Math.sin(now * 0.0017) * 1.2 : 0;
      const revealWobbleY = index === 1 ? Math.cos(now * 0.0013) * 0.8 : 0;
      track.style.setProperty('--pointer-shift-x', `${(motion.x * depth + revealWobbleX).toFixed(2)}px`);
      track.style.setProperty('--pointer-shift-y', `${(motion.y * depth + revealWobbleY).toFixed(2)}px`);
      track.style.setProperty('--pointer-tilt', `${(motion.x * depth * 0.035).toFixed(3)}deg`);
      track.style.setProperty('--pointer-tilt-x', `${(-motion.y * depth * 0.04).toFixed(3)}deg`);
      track.style.setProperty('--pointer-tilt-y', `${(motion.x * depth * 0.04).toFixed(3)}deg`);
    });

    sticky.querySelectorAll('.product-media').forEach((media) => {
      if (media.classList.contains('product-media--static')) return;
      const isLeft = media.classList.contains('product-media--left');
      const side = isLeft ? -1 : 1;
      const depth = isLeft ? 0.72 : 1;
      media.style.setProperty('--pointer-media-shift-x', `${(motion.x * depth).toFixed(2)}px`);
      media.style.setProperty('--pointer-media-shift-y', `${(motion.y * depth).toFixed(2)}px`);
      media.style.setProperty('--pointer-rotate-x', `${(-motion.y * 0.14).toFixed(3)}deg`);
      media.style.setProperty('--pointer-rotate-y', `${(motion.x * 0.14 * side).toFixed(3)}deg`);

      const frame = media.querySelector('.product-media__frame');
      frame.style.setProperty('--pointer-frame-shift-x', `${(motion.x * -side * 0.58).toFixed(2)}px`);
      frame.style.setProperty('--pointer-frame-shift-y', `${(motion.y * 0.46).toFixed(2)}px`);
      frame.style.setProperty('--pointer-frame-rotate-x', `${(-motion.y * 0.08).toFixed(3)}deg`);
      frame.style.setProperty('--pointer-frame-rotate-y', `${(motion.x * -side * 0.18).toFixed(3)}deg`);
    });

    const settling = Math.abs(motion.x) > 0.08 || Math.abs(motion.y) > 0.08;
    if (revealPoints.length || settling) {
      pointerMotionFrameRef.current = window.requestAnimationFrame(renderPointerMotion);
    } else {
      pointerMotionFrameRef.current = null;
      setPointerActive(false);
    }
  };

  const schedulePointerMotion = () => {
    if (pointerMotionFrameRef.current === null) {
      pointerMotionFrameRef.current = window.requestAnimationFrame(renderPointerMotion);
    }
  };

  useEffect(() => {
    const updateScroll = () => {
      const scene = sceneRef.current;
      if (!scene) return;
      const rect = scene.getBoundingClientRect();
      const travel = Math.max(scene.offsetHeight - window.innerHeight, 1);
      setScrollProgress(clamp(-rect.top / travel));
    };

    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('resize', updateScroll);
    return () => {
      window.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', updateScroll);
      if (pointerMotionFrameRef.current !== null) {
        window.cancelAnimationFrame(pointerMotionFrameRef.current);
      }
    };
  }, []);

  const handlePointerMove = (event) => {
    if (event.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    event.currentTarget.style.setProperty('--pointer-x', `${x}%`);
    event.currentTarget.style.setProperty('--pointer-y', `${y}%`);
    const now = performance.now();
    const previous = pointerRevealTrailRef.current[pointerRevealTrailRef.current.length - 1];
    const distance = previous ? Math.hypot(x - previous.x, y - previous.y) : Infinity;
    if (distance > 0.7) {
      const speed = clamp(distance / 3, 0.45, 1.7);
      const seed = now * 0.01;
      const createRevealPoint = (pointX, pointY, pointSeed, width, height) => ({
        x: clamp(pointX, 2, 98),
        y: clamp(pointY, 2, 98),
        time: now,
        life: 2200 + pseudoRandom(pointSeed + 4.6) * 800,
        seed: pointSeed,
        width,
        height,
        wanderX: 0.7 + pseudoRandom(pointSeed + 7.1) * 1.9,
        wanderY: 0.55 + pseudoRandom(pointSeed + 9.4) * 1.6,
      });
      const newPoints = [createRevealPoint(x, y, seed, 4.2 + speed * 1.4, 6.8 + speed * 2.4)];

      if (distance > 2.2 && pseudoRandom(seed * 1.7) > 0.56) {
        const angle = pseudoRandom(seed + 2.8) * Math.PI * 2;
        const scatter = 3.2 + pseudoRandom(seed + 5.3) * 8.4;
        newPoints.push(createRevealPoint(
          x + Math.cos(angle) * scatter,
          y + Math.sin(angle) * scatter,
          seed + 12.4,
          2.4 + pseudoRandom(seed + 6.7) * 1.9,
          3.8 + pseudoRandom(seed + 8.8) * 2.8,
        ));
      }

      pointerRevealTrailRef.current = [...pointerRevealTrailRef.current, ...newPoints].slice(-14);
    }
    pointerMotionRef.current.targetX = (x - 50) * 1.45;
    pointerMotionRef.current.targetY = (y - 50) * 0.95;
    schedulePointerMotion();
    setPointerActive(true);
  };

  const handlePointerEnter = () => {
    setPointerActive(true);
    schedulePointerMotion();
  };

  const handlePointerLeave = () => {
    pointerMotionRef.current.targetX = 0;
    pointerMotionRef.current.targetY = 0;
    schedulePointerMotion();
  };

  const stage = scrollProgress * (products.length - 1);
  const activeIndex = Math.min(products.length - 1, Math.round(stage));
  const activeProduct = products[activeIndex];
  const chapterIndex = Math.min(chapters.length - 1, Math.floor(scrollProgress * chapters.length));
  const activeChapter = chapters[chapterIndex];
  const worldProgress = Math.min(scrollProgress * 0.96, 0.96);

  return (
    <main className="site-shell">
      <header className="site-header">
        <a className="brand-mark" href="#top" aria-label="Drift Objects home">DRIFT<span>°</span></a>
        <nav className="site-nav" aria-label="Primary navigation">
          <a href="#objects">Objects</a>
          <a href="#journal">Journal</a>
          <button type="button" className="bag-button" onClick={() => selectedProduct ? setCheckoutStep('checkout') : openProduct(products[0])}>Bag <span>{bagCount}</span></button>
        </nav>
      </header>

      <section id="top" ref={sceneRef} className="immersive-scene" style={{ '--product-count': products.length }}>
        <div
          ref={stickyRef}
          className={`scene-sticky ${pointerActive ? 'has-pointer' : ''}`}
          onPointerMove={handlePointerMove}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
        >
          <div className="scene-background" aria-hidden="true" style={{ '--world-progress': worldProgress }}>
            <div className="scene-background__texture" />
            <WorldTrack modifier="world-track--backdrop" progress={worldProgress} />
            <WorldTrack modifier="world-track--reveal" progress={worldProgress} />
            <div className="scene-background__veil" />
            <div className="scene-background__mist scene-background__mist--one" />
            <div className="scene-background__mist scene-background__mist--two" />
            <AtmosphereCanvas />
            <div className="depth-rings depth-rings--one" />
            <div className="depth-rings depth-rings--two" />
            <div className="horizon-light" />
          </div>

          <div className="scene-topline">
            <span>IMMERSIVE OBJECTS / 2026</span>
            <span>SEOUL — 37° 33′ N</span>
          </div>

          <div className="scene-copy">
            <p className="eyebrow">WHERE / WARE / WEAR</p>
            <h1>Objects<br /><em>in motion.</em></h1>
            <p className="scene-description">A slow collection of useful forms, shaped by light, weight and the space between.</p>
          </div>

          <div className="chapter-copy">
            <span>{activeChapter.label}</span>
            <strong>{activeChapter.title}</strong>
            <p>{activeChapter.copy}</p>
          </div>

          <div className="product-stage" id="objects">
            {products.map((product, index) => {
              const offset = index - stage;
              const distance = Math.abs(offset);
              const opacity = clamp(1 - distance * 1.25, 0, 1);
              const scale = 1 - Math.min(distance, 1.3) * 0.1;
              const zIndex = Math.round(20 - distance * 4);
              const translateY = offset * 7;
              return (
                <div className="product-stage__item" key={product.id} style={{ opacity, transform: `translate3d(0, ${translateY}%, 0) scale(${scale})`, zIndex }}>
                  <ProductMedia product={product} side="left" style={{ '--product-accent': product.accent }} onOpen={openProduct} />
                  <ProductMedia product={product} side="right" style={{ '--product-accent': product.accent }} onOpen={openProduct} />
                </div>
              );
            })}
          </div>

          <div className="scene-center">
            <div className="scene-center__orb" style={{ '--orb-accent': activeProduct.accent }}>
              <div className="scene-center__orb-core" />
              <div className="scene-center__orb-ring scene-center__orb-ring--one" />
              <div className="scene-center__orb-ring scene-center__orb-ring--two" />
            </div>
            <div className="scene-center__meta">
              <span>{activeProduct.id} / 05</span>
              <span>{activeProduct.price}</span>
            </div>
          </div>

          <div className="scene-footer">
            <div className="scroll-cue"><span>SCROLL TO DRIFT</span><i /></div>
            <div className="scene-progress" aria-label={`Showing product ${activeProduct.id} of 05`}>
              {products.map((product, index) => <span className={index === activeIndex ? 'is-active' : ''} key={product.id}>{product.id}</span>)}
            </div>
            <span className="scene-note">THE BACKGROUND IS NEVER STILL</span>
          </div>
        </div>
      </section>

      <section id="materials" className="material-story">
        <article className="material-panel material-panel--plaster">
          <div className="material-panel__visual" />
          <div className="material-panel__copy">
            <span>THE ATELIER / 01</span>
            <h2>Made from<br /><em>stillness.</em></h2>
            <p>Plaster, shadow and a room built slowly enough for the eye to settle.</p>
          </div>
        </article>
        <article className="material-panel material-panel--fiber">
          <div className="material-panel__visual" />
          <div className="material-panel__copy">
            <span>THE FIBER / 02</span>
            <h2>Grown into<br /><em>form.</em></h2>
            <p>Raw textile plants become a soft vocabulary for everything we make next.</p>
          </div>
        </article>
      </section>

      <section id="journal" className="after-scene">
        <span>CONTINUE THE STUDY</span>
        <h2>More than an object.<br />A small atmosphere.</h2>
      </section>

      <ProductDetailOverlay
        product={selectedProduct}
        detailReady={detailReady}
        checkoutStep={checkoutStep}
        selectedSize={selectedSize}
        onSizeChange={setSelectedSize}
        onClose={closeProduct}
        onAddToBag={addToBag}
        onStartCheckout={startCheckout}
        onSubmitCheckout={submitCheckout}
      />
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
