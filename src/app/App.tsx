import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
} from "react";
import {
  createUrlAsset,
  deleteDraft,
  deleteTemplate,
  formatSize,
  getDraft,
  listTemplates,
  saveDraft,
  saveLocalAsset,
  saveTemplate,
  type StoredTemplate,
} from "../assets/AssetRepository";
import { EditorScene, type PreviewBackdrop } from "../editor/scene/EditorScene";
import { exportHtml, exportSize, iframeCode } from "../export/htmlExporter";
import type {
  ImageLayer,
  ImageSequenceLayer,
  BuiltInEffectLayer,
  Layer,
  TextLayer,
  TransitionProject,
} from "../project/model/project";
import { useEditorStore } from "../project/store/editorStore";
import { templates } from "../project/templates/templateRegistry";
import {
  deserializeProject,
  projectFileName,
  serializeProject,
} from "../project/persistence/projectFile";
import {
  animationDefinitions,
  createAnimation,
} from "../renderer/animations/animationRegistry";
import { effectDefinitions } from "../renderer/effects/effectRegistry";
import styles from "./App.module.css";

const sections = [
  { name: "Надпись", color: "#ff58dc" },
  { name: "Бегущие картинки", color: "#55e8ff" },
  { name: "Эффекты", color: "#a876ff" },
  { name: "Фон", color: "#52ffad" },
  { name: "Звук", color: "#ffb84e" },
  { name: "Время", color: "#ffe75a" },
  { name: "Шаблоны", color: "#ff7272" },
];
const fonts = [
  "Cinzel",
  "Playfair Display",
  "Cormorant Garamond",
  "Marck Script",
  "Pacifico",
  "Lobster",
  "Russo One",
  "Comfortaa",
  "Montserrat",
  "Unbounded",
  "Merriweather",
  "Caveat",
];

type AppDialog =
  | {
      kind: "notice";
      title: string;
      message: string;
    }
  | {
      kind: "confirm";
      title: string;
      message: string;
      confirmLabel?: string;
      danger?: boolean;
      onConfirm: () => void;
    }
  | {
      kind: "prompt";
      title: string;
      message: string;
      initialValue: string;
      confirmLabel?: string;
      onConfirm: (value: string) => void;
    };

function ImageControls({ layer }: { layer: ImageLayer }) {
  const [url, setUrl] = useState(""),
    [message, setMessage] = useState("");
  const addAsset = useEditorStore((s) => s.addAsset),
    update = useEditorStore((s) => s.updateLayer);
  const upload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setMessage("");
      const asset = await saveLocalAsset(file, "label-image", "image");
      addAsset(asset);
      update(layer.id, {
        assetId: asset.id,
        name: file.name.replace(/\.[^.]+$/, ""),
      });
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Не удалось загрузить файл.",
      );
    } finally {
      e.target.value = "";
    }
  };
  const useUrl = () => {
    try {
      const asset = createUrlAsset(url, "image");
      addAsset(asset);
      update(layer.id, { assetId: asset.id, name: asset.name });
      setMessage("");
    } catch {
      setMessage("Введите прямую корректную ссылку на изображение.");
    }
  };
  return (
    <section className={styles.controlGroup}>
      <h3>Изображение</h3>
      <p className={styles.warning}>
        Максимальный размер — 2 МБ. PNG, JPG, GIF или WebP.
      </p>
      <label className={styles.fileButton}>
        Загрузить с компьютера
        <input
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          onChange={upload}
        />
      </label>
      <div className={styles.urlRow}>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…/image.png"
        />
        <button onClick={useUrl} disabled={!url.trim()}>
          Добавить
        </button>
      </div>
      {message && <p className={styles.warning}>{message}</p>}
      <label className={styles.inlineCheck}>
        <input
          type="checkbox"
          checked={layer.preserveAspectRatio}
          onChange={(e) =>
            update(layer.id, { preserveAspectRatio: e.target.checked })
          }
        />
        Сохранять пропорции
      </label>
    </section>
  );
}

function BackgroundControls({
  backdrop,
  onBackdrop,
}: {
  backdrop: PreviewBackdrop;
  onBackdrop(value: PreviewBackdrop): void;
}) {
  const background = useEditorStore((state) => state.project.scene.background),
    addAsset = useEditorStore((state) => state.addAsset),
    update = useEditorStore((state) => state.updateBackground);
  const [url, setUrl] = useState(""),
    [message, setMessage] = useState("");
  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const asset = await saveLocalAsset(file, "background-image", "image");
      addAsset(asset);
      update({ mode: "image", assetId: asset.id });
      setMessage("");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Не удалось загрузить фон.",
      );
    } finally {
      event.target.value = "";
    }
  };
  const useUrl = () => {
    try {
      const asset = createUrlAsset(url, "image");
      addAsset(asset);
      update({ mode: "image", assetId: asset.id });
      setMessage("");
    } catch {
      setMessage("Введите прямую корректную ссылку на изображение.");
    }
  };
  const game = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Для проверки выберите изображение игровой сцены.");
      return;
    }
    onBackdrop({
      mode: "game",
      color: backdrop.color,
      url: URL.createObjectURL(file),
    });
    event.target.value = "";
  };
  return (
    <div className={styles.tabControls}>
      <h3>Фон перехода</h3>
      <label>
        Тип
        <select
          value={background.mode}
          onChange={(event) =>
            update({ mode: event.target.value as typeof background.mode })
          }
        >
          <option value="transparent">Transparent</option>
          <option value="color">Color</option>
          <option value="gradient">Gradient</option>
          <option value="image">Image</option>
        </select>
      </label>
      {background.mode === "color" && (
        <label>
          Цвет
          <input
            type="color"
            value={background.color}
            onChange={(event) => update({ color: event.target.value })}
          />
        </label>
      )}
      {background.mode === "gradient" && (
        <>
          <div className={styles.propertyGrid}>
            <label>
              Цвет 1
              <input
                type="color"
                value={background.gradient.color1}
                onChange={(event) =>
                  update({
                    gradient: {
                      ...background.gradient,
                      color1: event.target.value,
                    },
                  })
                }
              />
            </label>
            <label>
              Цвет 2
              <input
                type="color"
                value={background.gradient.color2}
                onChange={(event) =>
                  update({
                    gradient: {
                      ...background.gradient,
                      color2: event.target.value,
                    },
                  })
                }
              />
            </label>
            <label>
              Тип
              <select
                value={background.gradient.type}
                onChange={(event) =>
                  update({
                    gradient: {
                      ...background.gradient,
                      type: event.target.value as "linear" | "radial",
                    },
                  })
                }
              >
                <option value="linear">Linear</option>
                <option value="radial">Radial</option>
              </select>
            </label>
            <label>
              Угол
              <input
                type="number"
                min="0"
                max="360"
                value={background.gradient.angle}
                onChange={(event) =>
                  update({
                    gradient: {
                      ...background.gradient,
                      angle: Number(event.target.value),
                    },
                  })
                }
              />
            </label>
          </div>
        </>
      )}
      {background.mode === "image" && (
        <>
          <p className={styles.warning}>
            Максимальный размер фоновой картинки — 5 МБ.
          </p>
          <label className={styles.fileButton}>
            Загрузить с компьютера
            <input
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              onChange={upload}
            />
          </label>
          <div className={styles.urlRow}>
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://…/background.jpg"
            />
            <button onClick={useUrl} disabled={!url.trim()}>
              Добавить
            </button>
          </div>
          <label>
            Масштабирование
            <select
              value={background.fit}
              onChange={(event) =>
                update({ fit: event.target.value as typeof background.fit })
              }
            >
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
              <option value="stretch">Stretch</option>
              <option value="original">Original</option>
            </select>
          </label>
          <div className={styles.propertyGrid}>
            <label>
              Brightness
              <input
                type="number"
                min="0"
                max="3"
                step=".05"
                value={background.filters.brightness}
                onChange={(event) =>
                  update({
                    filters: {
                      ...background.filters,
                      brightness: Number(event.target.value),
                    },
                  })
                }
              />
            </label>
            <label>
              Contrast
              <input
                type="number"
                min="0"
                max="3"
                step=".05"
                value={background.filters.contrast}
                onChange={(event) =>
                  update({
                    filters: {
                      ...background.filters,
                      contrast: Number(event.target.value),
                    },
                  })
                }
              />
            </label>
            <label>
              Saturation
              <input
                type="number"
                min="0"
                max="3"
                step=".05"
                value={background.filters.saturation}
                onChange={(event) =>
                  update({
                    filters: {
                      ...background.filters,
                      saturation: Number(event.target.value),
                    },
                  })
                }
              />
            </label>
            <label>
              Blur
              <input
                type="number"
                min="0"
                max="30"
                value={background.filters.blur}
                onChange={(event) =>
                  update({
                    filters: {
                      ...background.filters,
                      blur: Number(event.target.value),
                    },
                  })
                }
              />
            </label>
          </div>
        </>
      )}
      <label>
        Opacity — {Math.round(background.opacity * 100)}%
        <input
          type="range"
          min="0"
          max="1"
          step=".01"
          value={background.opacity}
          onChange={(event) => update({ opacity: Number(event.target.value) })}
        />
      </label>
      {message && <p className={styles.warning}>{message}</p>}
      <h3>Preview background</h3>
      <label>
        Подложка
        <select
          value={backdrop.mode}
          onChange={(event) =>
            onBackdrop({
              ...backdrop,
              mode: event.target.value as PreviewBackdrop["mode"],
            })
          }
        >
          <option value="checkerboard">Checkerboard</option>
          <option value="dark">Dark</option>
          <option value="white">White</option>
          <option value="custom">Custom</option>
          {backdrop.url && <option value="game">Фон игры</option>}
        </select>
      </label>
      {backdrop.mode === "custom" && (
        <label>
          Цвет подложки
          <input
            type="color"
            value={backdrop.color}
            onChange={(event) =>
              onBackdrop({ ...backdrop, color: event.target.value })
            }
          />
        </label>
      )}
      <label className={styles.fileButton}>
        Проверить на фоне игры
        <input type="file" accept="image/*" onChange={game} />
      </label>
      <p className={styles.warning}>
        Подсказка: Preview background и скриншот игры не включаются в экспорт.
      </p>
    </div>
  );
}

function SequenceControls({ layer }: { layer: ImageSequenceLayer }) {
  const [url, setUrl] = useState(""),
    [message, setMessage] = useState("");
  const assets = useEditorStore((s) => s.project.assets),
    drawingId = useEditorStore((s) => s.pathDrawingLayerId),
    addAsset = useEditorStore((s) => s.addAsset),
    update = useEditorStore((s) => s.updateLayer),
    setDrawing = useEditorStore((s) => s.setPathDrawing);
  const upload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []),
      available = Math.max(0, 20 - layer.assetIds.length);
    if (files.length > available) {
      setMessage(
        `Можно использовать до 20 изображений. Сейчас доступно мест: ${available}.`,
      );
      e.target.value = "";
      return;
    }
    try {
      const ids = [...layer.assetIds];
      for (const file of files) {
        const asset = await saveLocalAsset(file, "sequence-image", "image");
        addAsset(asset);
        ids.push(asset.id);
      }
      update(layer.id, { assetIds: ids });
      setMessage("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Не удалось загрузить изображение.",
      );
    } finally {
      e.target.value = "";
    }
  };
  const useUrl = () => {
    if (layer.assetIds.length >= 20) {
      setMessage("Можно использовать до 20 изображений.");
      return;
    }
    try {
      const asset = createUrlAsset(url, "image");
      addAsset(asset);
      update(layer.id, { assetIds: [...layer.assetIds, asset.id] });
      setUrl("");
      setMessage("");
    } catch {
      setMessage("Введите прямую корректную ссылку на изображение.");
    }
  };
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= layer.assetIds.length) return;
    const ids = [...layer.assetIds];
    [ids[index], ids[target]] = [ids[target], ids[index]];
    update(layer.id, { assetIds: ids });
  };
  return (
    <>
      <section className={styles.controlGroup}>
        <h3>Изображения</h3>
        <p className={styles.warning}>
          Максимум 1 МБ каждое. До 20 изображений.
        </p>
        <label className={styles.fileButton}>
          Загрузить с компьютера
          <input
            type="file"
            multiple
            accept="image/png,image/jpeg,image/gif,image/webp"
            onChange={upload}
          />
        </label>
        <div className={styles.urlRow}>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…/image.png"
          />
          <button onClick={useUrl} disabled={!url.trim()}>
            Добавить
          </button>
        </div>
        {message && <p className={styles.warning}>{message}</p>}
        <div className={styles.assetList}>
          {layer.assetIds.map((id, index) => {
            const asset = assets.find((item) => item.id === id);
            return (
              <div key={`${id}-${index}`}>
                <span>
                  {index + 1}. {asset?.name ?? "Изображение"}
                </span>
                <button onClick={() => move(index, -1)}>↑</button>
                <button onClick={() => move(index, 1)}>↓</button>
                <button
                  onClick={() =>
                    update(layer.id, {
                      assetIds: layer.assetIds.filter((_, i) => i !== index),
                    })
                  }
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
        {layer.assetIds.length === 1 && (
          <label>
            Количество повторов — {layer.repeatCount}
            <input
              type="range"
              min="1"
              max="20"
              value={layer.repeatCount}
              onChange={(e) =>
                update(layer.id, { repeatCount: Number(e.target.value) })
              }
            />
          </label>
        )}
      </section>
      <details className={styles.controlGroup} open>
        <summary>Траектория</summary>
        <label>
          Форма
          <select
            value={layer.pathType}
            onChange={(e) => {
              const pathType = e.target.value as ImageSequenceLayer["pathType"];
              update(layer.id, { pathType });
              if (pathType !== "custom") setDrawing(null);
            }}
          >
            <option value="line">Line</option>
            <option value="vertical">Vertical</option>
            <option value="zigzag">Zigzag</option>
            <option value="wave">Wave</option>
            <option value="arc">Arc</option>
            <option value="circle">Circle</option>
            <option value="custom">Custom Path</option>
          </select>
        </label>
        <div className={styles.propertyGrid}>
          <label>
            Размер
            <input
              type="number"
              min="20"
              max="400"
              value={layer.imageSize}
              onChange={(e) =>
                update(layer.id, { imageSize: Number(e.target.value) })
              }
            />
          </label>
          <label>
            Spacing
            <input
              type="number"
              min="0"
              max="300"
              value={layer.spacing}
              onChange={(e) =>
                update(layer.id, { spacing: Number(e.target.value) })
              }
            />
          </label>
          {["wave", "zigzag"].includes(layer.pathType) && (
            <>
              <label>
                Амплитуда
                <input
                  type="number"
                  value={layer.pathSettings.amplitude}
                  onChange={(e) =>
                    update(layer.id, {
                      pathSettings: {
                        ...layer.pathSettings,
                        amplitude: Number(e.target.value),
                      },
                    })
                  }
                />
              </label>
              <label>
                Частота
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={layer.pathSettings.frequency}
                  onChange={(e) =>
                    update(layer.id, {
                      pathSettings: {
                        ...layer.pathSettings,
                        frequency: Number(e.target.value),
                      },
                    })
                  }
                />
              </label>
            </>
          )}
          {layer.pathType === "arc" && (
            <label>
              Высота дуги
              <input
                type="number"
                value={layer.pathSettings.arcHeight}
                onChange={(e) =>
                  update(layer.id, {
                    pathSettings: {
                      ...layer.pathSettings,
                      arcHeight: Number(e.target.value),
                    },
                  })
                }
              />
            </label>
          )}
        </div>
        {layer.pathType === "custom" && (
          <div className={styles.customPathControls}>
            <button
              onClick={() =>
                setDrawing(drawingId === layer.id ? null : layer.id)
              }
            >
              {drawingId === layer.id
                ? "Завершить рисование"
                : "Нарисовать путь"}
            </button>
            <label>
              Smooth — {layer.pathSettings.smooth}%
              <input
                type="range"
                min="0"
                max="100"
                value={layer.pathSettings.smooth}
                onChange={(e) =>
                  update(layer.id, {
                    pathSettings: {
                      ...layer.pathSettings,
                      smooth: Number(e.target.value),
                    },
                  })
                }
              />
            </label>
            <label className={styles.inlineCheck}>
              <input
                type="checkbox"
                checked={layer.pathSettings.reverse}
                onChange={(e) =>
                  update(layer.id, {
                    pathSettings: {
                      ...layer.pathSettings,
                      reverse: e.target.checked,
                    },
                  })
                }
              />
              Reverse
            </label>
            <label className={styles.inlineCheck}>
              <input
                type="checkbox"
                checked={layer.pathSettings.closed}
                onChange={(e) =>
                  update(layer.id, {
                    pathSettings: {
                      ...layer.pathSettings,
                      closed: e.target.checked,
                    },
                  })
                }
              />
              Closed path
            </label>
            <label className={styles.inlineCheck}>
              <input
                type="checkbox"
                checked={layer.pathSettings.showPath}
                onChange={(e) =>
                  update(layer.id, {
                    pathSettings: {
                      ...layer.pathSettings,
                      showPath: e.target.checked,
                    },
                  })
                }
              />
              Show path
            </label>
            <p className={styles.warning}>
              Подсказка: нажмите «Нарисовать путь» и проведите линию мышью прямо
              по сцене.
            </p>
          </div>
        )}
      </details>
      <details className={styles.controlGroup} open>
        <summary>Wave-анимация</summary>
        <label>
          Тип
          <select
            value={layer.wave.type}
            onChange={(e) =>
              update(layer.id, {
                wave: {
                  ...layer.wave,
                  type: e.target.value as ImageSequenceLayer["wave"]["type"],
                },
              })
            }
          >
            <option value="light-wave">Light Wave</option>
            <option value="fade-wave">Fade Wave</option>
            <option value="pop">Pop</option>
            <option value="bounce-wave">Bounce Wave</option>
            <option value="spin-wave">Spin Wave</option>
            <option value="neon-wave">Neon Wave</option>
            <option value="golden-wave">Golden Wave</option>
            <option value="color-wave">Color Wave</option>
            <option value="blur-focus">Blur Focus</option>
            <option value="flip">Flip</option>
            <option value="random-wave">Random Wave</option>
          </select>
        </label>
        <div className={styles.propertyGrid}>
          <label>
            Цикл, сек.
            <input
              type="number"
              min=".2"
              step=".1"
              value={layer.wave.duration}
              onChange={(e) =>
                update(layer.id, {
                  wave: { ...layer.wave, duration: Number(e.target.value) },
                })
              }
            />
          </label>
          <label>
            Задержка
            <input
              type="number"
              min="0"
              step=".01"
              value={layer.wave.delay}
              onChange={(e) =>
                update(layer.id, {
                  wave: { ...layer.wave, delay: Number(e.target.value) },
                })
              }
            />
          </label>
          <label>
            Неактивная opacity
            <input
              type="number"
              min="0"
              max="1"
              step=".05"
              value={layer.wave.inactiveOpacity}
              onChange={(e) =>
                update(layer.id, {
                  wave: {
                    ...layer.wave,
                    inactiveOpacity: Number(e.target.value),
                  },
                })
              }
            />
          </label>
          <label>
            Активный scale
            <input
              type="number"
              min=".1"
              max="3"
              step=".05"
              value={layer.wave.activeScale}
              onChange={(e) =>
                update(layer.id, {
                  wave: { ...layer.wave, activeScale: Number(e.target.value) },
                })
              }
            />
          </label>
          <label>
            Glow
            <input
              type="color"
              value={layer.wave.glowColor}
              onChange={(e) =>
                update(layer.id, {
                  wave: { ...layer.wave, glowColor: e.target.value },
                })
              }
            />
          </label>
          <label>
            Поворот
            <input
              type="number"
              min="-360"
              max="360"
              value={layer.wave.rotation}
              onChange={(event) =>
                update(layer.id, {
                  wave: { ...layer.wave, rotation: Number(event.target.value) },
                })
              }
            />
          </label>
          <label>
            Blur
            <input
              type="number"
              min="0"
              max="50"
              value={layer.wave.blur}
              onChange={(event) =>
                update(layer.id, {
                  wave: { ...layer.wave, blur: Number(event.target.value) },
                })
              }
            />
          </label>
          <label>
            Active brightness
            <input
              type="number"
              min="0.1"
              max="4"
              step="0.05"
              value={layer.wave.activeBrightness}
              onChange={(event) =>
                update(layer.id, {
                  wave: {
                    ...layer.wave,
                    activeBrightness: Number(event.target.value),
                  },
                })
              }
            />
          </label>
          {layer.wave.type === "random-wave" && (
            <label>
              Random seed
              <input
                type="number"
                min="1"
                max="9999"
                value={layer.wave.randomSeed}
                onChange={(event) =>
                  update(layer.id, {
                    wave: {
                      ...layer.wave,
                      randomSeed: Number(event.target.value),
                    },
                  })
                }
              />
            </label>
          )}
        </div>
      </details>
    </>
  );
}

function AnimationControls({ layer }: { layer: Layer }) {
  const update = useEditorStore((s) => s.updateLayer),
    [choice, setChoice] = useState("blink");
  const add = () => {
    if (layer.animations.length >= 4) return;
    update(layer.id, {
      animations: [...layer.animations, createAnimation(choice)],
    });
  };
  const change = (
    animationId: string,
    key: string,
    value: number | string | boolean,
  ) =>
    update(layer.id, {
      animations: layer.animations.map((item) =>
        item.id === animationId
          ? { ...item, settings: { ...item.settings, [key]: value } }
          : item,
      ),
    });
  return (
    <details className={styles.controlGroup} open>
      <summary>Animation</summary>
      <div className={styles.urlRow}>
        <select value={choice} onChange={(e) => setChoice(e.target.value)}>
          {animationDefinitions.map((item) => (
            <option value={item.type} key={item.type}>
              {item.title}
            </option>
          ))}
        </select>
        <button onClick={add} disabled={layer.animations.length >= 4}>
          + Добавить
        </button>
      </div>
      {layer.animations.length >= 4 && (
        <p className={styles.warning}>Максимум четыре анимации одновременно.</p>
      )}
      <div className={styles.animationList}>
        {layer.animations.map((animation) => {
          const definition = animationDefinitions.find(
            (item) => item.type === animation.type,
          )!;
          const controls = definition.controls ?? [
            {
              key: "duration",
              label: "Скорость, сек.",
              type: "number" as const,
              min: 0.1,
              max: 6,
              step: 0.1,
            },
            {
              key: "strength",
              label: "Интенсивность",
              type: "number" as const,
              step: 0.05,
            },
          ];
          return (
            <div className={styles.animationCard} key={animation.id}>
              <div>
                <strong>{definition.title}</strong>
                <small>{definition.description}</small>
                <button
                  title="Удалить анимацию"
                  onClick={() =>
                    update(layer.id, {
                      animations: layer.animations.filter(
                        (item) => item.id !== animation.id,
                      ),
                    })
                  }
                >
                  ×
                </button>
              </div>
              <div className={styles.advancedGrid}>
                {controls.map((control) => (
                  <label
                    className={
                      control.type === "boolean" ? styles.inlineCheck : ""
                    }
                    key={control.key}
                  >
                    {control.type === "boolean" ? (
                      <>
                        <input
                          type="checkbox"
                          checked={Boolean(animation.settings[control.key])}
                          onChange={(e) =>
                            change(animation.id, control.key, e.target.checked)
                          }
                        />
                        {control.label}
                      </>
                    ) : (
                      <>
                        {control.label}
                        {control.type === "select" ? (
                          <select
                            value={String(animation.settings[control.key])}
                            onChange={(e) =>
                              change(animation.id, control.key, e.target.value)
                            }
                          >
                            {control.options?.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={control.type}
                            min={control.min}
                            max={control.max}
                            step={control.step}
                            value={String(animation.settings[control.key])}
                            onChange={(e) =>
                              change(
                                animation.id,
                                control.key,
                                control.type === "number"
                                  ? Number(e.target.value)
                                  : e.target.value,
                              )
                            }
                          />
                        )}
                      </>
                    )}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </details>
  );
}

function TextControls({ layer }: { layer: TextLayer }) {
  const [message, setMessage] = useState(""),
    [fontUrl, setFontUrl] = useState("");
  const update = useEditorStore((s) => s.updateLayer),
    addAsset = useEditorStore((s) => s.addAsset);
  const uploadFont = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setMessage("");
      const asset = await saveLocalAsset(file, "font", "font");
      addAsset(asset);
      update(layer.id, { customFontAssetId: asset.id, fontFamily: file.name });
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Не удалось загрузить шрифт.",
      );
    } finally {
      e.target.value = "";
    }
  };
  const useFontUrl = () => {
    try {
      const asset = createUrlAsset(fontUrl, "font");
      addAsset(asset);
      update(layer.id, { customFontAssetId: asset.id, fontFamily: asset.name });
      setMessage("");
    } catch {
      setMessage("Введите прямую корректную ссылку на файл шрифта.");
    }
  };
  return (
    <>
      <section className={styles.controlGroup}>
        <h3>Содержание</h3>
        <label>
          Текст
          <textarea
            value={layer.content}
            onChange={(e) => update(layer.id, { content: e.target.value })}
          />
        </label>
      </section>
      <details className={styles.controlGroup} open>
        <summary>Типографика</summary>
        <label>
          Шрифт
          <select
            value={layer.customFontAssetId ? "custom" : layer.fontFamily}
            onChange={(e) =>
              e.target.value !== "custom" &&
              update(layer.id, {
                fontFamily: e.target.value,
                customFontAssetId: undefined,
              })
            }
          >
            {fonts.map((font) => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
            {layer.customFontAssetId && (
              <option value="custom">Свой шрифт</option>
            )}
          </select>
        </label>
        <label className={styles.fileButton}>
          + Использовать свой шрифт
          <input
            type="file"
            accept=".woff,.woff2,.ttf,.otf"
            onChange={uploadFont}
          />
        </label>
        <div className={styles.urlRow}>
          <input
            value={fontUrl}
            onChange={(e) => setFontUrl(e.target.value)}
            placeholder="https://…/font.woff2"
          />
          <button onClick={useFontUrl} disabled={!fontUrl.trim()}>
            Добавить
          </button>
        </div>
        <p className={styles.warning}>
          Подсказка: WOFF, WOFF2, TTF или OTF. Локальный шрифт будет встроен в
          HTML.
        </p>
        {message && <p className={styles.warning}>{message}</p>}
        <div className={styles.propertyGrid}>
          <label>
            Размер
            <input
              type="number"
              min="8"
              max="500"
              value={layer.fontSize}
              onChange={(e) =>
                update(layer.id, { fontSize: Number(e.target.value) })
              }
            />
          </label>
          <label>
            Жирность
            <select
              value={layer.fontWeight}
              onChange={(e) =>
                update(layer.id, { fontWeight: Number(e.target.value) })
              }
            >
              <option value="400">Regular</option>
              <option value="600">SemiBold</option>
              <option value="700">Bold</option>
              <option value="800">ExtraBold</option>
            </select>
          </label>
          <label>
            Цвет
            <input
              type="color"
              value={layer.color}
              onChange={(e) => update(layer.id, { color: e.target.value })}
            />
          </label>
          <label>
            Интервал
            <input
              type="number"
              value={layer.letterSpacing}
              onChange={(e) =>
                update(layer.id, { letterSpacing: Number(e.target.value) })
              }
            />
          </label>
          <label>
            Высота строки
            <input
              type="number"
              min=".5"
              max="3"
              step=".05"
              value={layer.lineHeight}
              onChange={(e) =>
                update(layer.id, { lineHeight: Number(e.target.value) })
              }
            />
          </label>
          <label>
            Регистр
            <select
              value={layer.textTransform}
              onChange={(e) =>
                update(layer.id, {
                  textTransform: e.target.value as TextLayer["textTransform"],
                })
              }
            >
              <option value="none">Как введено</option>
              <option value="uppercase">UPPERCASE</option>
              <option value="lowercase">lowercase</option>
              <option value="capitalize">Capitalize</option>
            </select>
          </label>
        </div>
        <label className={styles.inlineCheck}>
          <input
            type="checkbox"
            checked={layer.italic}
            onChange={(e) => update(layer.id, { italic: e.target.checked })}
          />
          Курсив
        </label>
      </details>
      <details className={styles.controlGroup}>
        <summary>Обводка, тень и свечение</summary>
        <label className={styles.inlineCheck}>
          <input
            type="checkbox"
            checked={layer.stroke.enabled}
            onChange={(e) =>
              update(layer.id, {
                stroke: { ...layer.stroke, enabled: e.target.checked },
              })
            }
          />
          Обводка
        </label>
        {layer.stroke.enabled && (
          <div className={styles.propertyGrid}>
            <label>
              Цвет
              <input
                type="color"
                value={layer.stroke.color}
                onChange={(e) =>
                  update(layer.id, {
                    stroke: { ...layer.stroke, color: e.target.value },
                  })
                }
              />
            </label>
            <label>
              Толщина
              <input
                type="number"
                min="0"
                max="30"
                value={layer.stroke.width}
                onChange={(e) =>
                  update(layer.id, {
                    stroke: { ...layer.stroke, width: Number(e.target.value) },
                  })
                }
              />
            </label>
          </div>
        )}
        <label className={styles.inlineCheck}>
          <input
            type="checkbox"
            checked={layer.shadow.enabled}
            onChange={(e) =>
              update(layer.id, {
                shadow: { ...layer.shadow, enabled: e.target.checked },
              })
            }
          />
          Тень
        </label>
        {layer.shadow.enabled && (
          <div className={styles.propertyGrid}>
            <label>
              Цвет
              <input
                type="color"
                value={layer.shadow.color}
                onChange={(e) =>
                  update(layer.id, {
                    shadow: { ...layer.shadow, color: e.target.value },
                  })
                }
              />
            </label>
            <label>
              Размытие
              <input
                type="number"
                value={layer.shadow.blur}
                onChange={(e) =>
                  update(layer.id, {
                    shadow: { ...layer.shadow, blur: Number(e.target.value) },
                  })
                }
              />
            </label>
            <label>
              X
              <input
                type="number"
                value={layer.shadow.x}
                onChange={(e) =>
                  update(layer.id, {
                    shadow: { ...layer.shadow, x: Number(e.target.value) },
                  })
                }
              />
            </label>
            <label>
              Y
              <input
                type="number"
                value={layer.shadow.y}
                onChange={(e) =>
                  update(layer.id, {
                    shadow: { ...layer.shadow, y: Number(e.target.value) },
                  })
                }
              />
            </label>
          </div>
        )}
        {layer.glows.map((glow, index) => (
          <div className={styles.effectBlock} key={index}>
            <label className={styles.inlineCheck}>
              <input
                type="checkbox"
                checked={glow.enabled}
                onChange={(e) =>
                  update(layer.id, {
                    glows: layer.glows.map((item, i) =>
                      i === index
                        ? { ...item, enabled: e.target.checked }
                        : item,
                    ),
                  })
                }
              />
              {index ? "Второе свечение" : "Свечение"}
            </label>
            {glow.enabled && (
              <div className={styles.propertyGrid}>
                <label>
                  Цвет
                  <input
                    type="color"
                    value={glow.color}
                    onChange={(e) =>
                      update(layer.id, {
                        glows: layer.glows.map((item, i) =>
                          i === index
                            ? { ...item, color: e.target.value }
                            : item,
                        ),
                      })
                    }
                  />
                </label>
                <label>
                  Радиус
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={glow.radius}
                    onChange={(e) =>
                      update(layer.id, {
                        glows: layer.glows.map((item, i) =>
                          i === index
                            ? { ...item, radius: Number(e.target.value) }
                            : item,
                        ),
                      })
                    }
                  />
                </label>
              </div>
            )}
          </div>
        ))}
      </details>
    </>
  );
}

function BuiltInEffectControls({ layer }: { layer: BuiltInEffectLayer }) {
  const update = useEditorStore((s) => s.updateLayer);
  const setting = (key: string, value: string | number) =>
    update(layer.id, { settings: { ...layer.settings, [key]: value } });
  const ranges: Array<[string, string, number, number, number]> = [
    ["count", "Количество", 1, 80, 1],
    ["speed", "Скорость", 0.3, 10, 0.1],
    ["size", "Размер", 2, 50, 1],
    ["intensity", "Интенсивность", 0.1, 1, 0.05],
  ];
  return (
    <details className={styles.controlGroup} open>
      <summary>Настройки эффекта</summary>
      <div className={styles.propertyGrid}>
        {(["primaryColor", "secondaryColor"] as const).map((key, index) => (
          <label key={key}>
            {index ? "Второй цвет" : "Основной цвет"}
            <input
              type="color"
              value={String(layer.settings[key])}
              onChange={(e) => setting(key, e.target.value)}
            />
          </label>
        ))}
      </div>
      {ranges.map(([key, label, min, max, step]) => (
        <label key={key}>
          {label} —{" "}
          {Number(layer.settings[key]).toFixed(
            key === "count" || key === "size" ? 0 : 1,
          )}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={Number(layer.settings[key])}
            onChange={(e) => setting(key, Number(e.target.value))}
          />
        </label>
      ))}
    </details>
  );
}

function Inspector({ layer }: { layer?: Layer }) {
  const update = useEditorStore((s) => s.updateLayer);
  const align = useEditorStore((s) => s.alignSelected);
  if (!layer)
    return (
      <div className={styles.inspectorEmpty}>
        <div>◇</div>
        <strong>Ничего не выбрано</strong>
        <span>Выберите объект на сцене, чтобы настроить его</span>
      </div>
    );
  const transform = (
    key: "x" | "y" | "width" | "height" | "rotation",
    value: number,
  ) => update(layer.id, { transform: { ...layer.transform, [key]: value } });
  return (
    <div className={styles.properties}>
      <label>
        Название
        <input
          value={layer.name}
          onChange={(e) => update(layer.id, { name: e.target.value })}
        />
      </label>
      {layer.type === "text" && <TextControls layer={layer} />}{" "}
      {layer.type === "image" && <ImageControls layer={layer} />}{" "}
      {layer.type === "image-sequence" && <SequenceControls layer={layer} />}{" "}
      {layer.type === "built-in-effect" && (
        <BuiltInEffectControls layer={layer} />
      )}{" "}
      {layer.type !== "image-sequence" && <AnimationControls layer={layer} />}
      <details className={styles.controlGroup}>
        <summary>Положение и размер</summary>
        <div className={styles.propertyGrid}>
          {(["x", "y", "width", "height", "rotation"] as const).map((key) => (
            <label key={key}>
              {key.toUpperCase()}
              <input
                type="number"
                value={Math.round(layer.transform[key])}
                onChange={(e) => transform(key, Number(e.target.value))}
              />
            </label>
          ))}
        </div>
        <div className={styles.transformActions}>
          <button onClick={() => align("horizontal")}>По центру X</button>
          <button onClick={() => align("vertical")}>По центру Y</button>
          <button onClick={() => align("reset-size")}>Сбросить размер</button>
          <button onClick={() => align("reset-rotation")}>
            Сбросить поворот
          </button>
        </div>
        <label>
          Прозрачность — {Math.round(layer.opacity * 100)}%
          <input
            type="range"
            min="0"
            max="1"
            step=".01"
            value={layer.opacity}
            onChange={(e) =>
              update(layer.id, { opacity: Number(e.target.value) })
            }
          />
        </label>
        <div className={styles.propertyGrid}>
          <label>
            Задержка
            <input
              type="number"
              min="0"
              step=".1"
              value={layer.timing.startDelay}
              onChange={(e) =>
                update(layer.id, {
                  timing: {
                    ...layer.timing,
                    startDelay: Number(e.target.value),
                  },
                })
              }
            />
          </label>
          <label>
            Длительность
            <input
              type="number"
              min=".1"
              step=".1"
              value={layer.timing.duration}
              onChange={(e) =>
                update(layer.id, {
                  timing: { ...layer.timing, duration: Number(e.target.value) },
                })
              }
            />
          </label>
        </div>
        <label>
          Завершение слоя
          <select
            value={layer.timing.endAnimation}
            onChange={(e) =>
              update(layer.id, {
                timing: {
                  ...layer.timing,
                  endAnimation: e.target
                    .value as Layer["timing"]["endAnimation"],
                },
              })
            }
          >
            <option value="none">Без исчезновения</option>
            <option value="fade">Fade Out</option>
            <option value="blur">Blur Out</option>
            <option value="zoom">Zoom Out</option>
          </select>
        </label>
      </details>
      <button
        className={styles.deleteObject}
        onClick={() => useEditorStore.getState().deleteSelected()}
      >
        🗑 Удалить объект
      </button>
    </div>
  );
}

export function App() {
  const [active, setActive] = useState("Надпись"),
    [preview, setPreview] = useState(false),
    [restartKey, setRestartKey] = useState(0),
    [saveState, setSaveState] = useState<
      "loading" | "saving" | "saved" | "error"
    >("loading"),
    [draftToRestore, setDraftToRestore] = useState<TransitionProject | null>(
      null,
    ),
    [exportResult, setExportResult] = useState<{
      html: string;
      iframe: string;
    } | null>(null),
    [exportBusy, setExportBusy] = useState(false),
    [iframeCopied, setIframeCopied] = useState(false),
    [myTemplates, setMyTemplates] = useState<StoredTemplate[]>([]),
    [readyToSave, setReadyToSave] = useState(false),
    [appDialog, setAppDialog] = useState<AppDialog | null>(null),
    [dialogInput, setDialogInput] = useState(""),
    [backdrop, setBackdrop] = useState<PreviewBackdrop>({
      mode: "checkerboard",
      color: "#282b36",
    });
  const projectInput = useRef<HTMLInputElement>(null);
  const accent = sections.find((item) => item.name === active)!.color;
  const project = useEditorStore((s) => s.project),
    selectedId = useEditorStore((s) => s.selectedLayerId),
    past = useEditorStore((s) => s.past),
    future = useEditorStore((s) => s.future),
    gridEnabled = useEditorStore((s) => s.gridEnabled),
    gridSize = useEditorStore((s) => s.gridSize),
    showSafeArea = useEditorStore((s) => s.showSafeArea),
    snappingEnabled = useEditorStore((s) => s.snappingEnabled),
    selected = project.layers.find((layer) => layer.id === selectedId);
  const showNotice = (title: string, message: string) =>
    setAppDialog({ kind: "notice", title, message });
  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: { confirmLabel?: string; danger?: boolean },
  ) =>
    setAppDialog({
      kind: "confirm",
      title,
      message,
      onConfirm,
      ...options,
    });
  const showPrompt = (
    title: string,
    message: string,
    initialValue: string,
    onConfirm: (value: string) => void,
  ) => {
    setDialogInput(initialValue);
    setAppDialog({
      kind: "prompt",
      title,
      message,
      initialValue,
      onConfirm,
    });
  };
  const actions = useEditorStore.getState();
  const sceneAnimation = project.timing.sceneAnimation ?? {
    enter: "none" as const,
    exit: "none" as const,
    enterDuration: 0.7,
    exitDuration: 0.7,
    strength: 18,
    easing: "ease-in-out" as const,
  };
  useEffect(
    () => () => {
      if (backdrop.url) URL.revokeObjectURL(backdrop.url);
    },
    [backdrop.url],
  );
  useEffect(() => {
    void getDraft()
      .then((draft) => {
        if (draft) setDraftToRestore(draft);
        else setReadyToSave(true);
        setSaveState("saved");
      })
      .catch(() => {
        setReadyToSave(true);
        setSaveState("error");
      });
  }, []);
  useEffect(() => {
    void listTemplates()
      .then(setMyTemplates)
      .catch(() => setMyTemplates([]));
  }, []);
  useEffect(() => {
    if (!readyToSave) return;
    setSaveState("saving");
    const timer = window.setTimeout(() => {
      void saveDraft(project)
        .then(() => setSaveState("saved"))
        .catch(() => setSaveState("error"));
    }, 700);
    return () => window.clearTimeout(timer);
  }, [project, readyToSave]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(
          (e.target as HTMLElement).tagName,
        )
      )
        return;
      const s = useEditorStore.getState();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        s.undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        s.redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        s.duplicateSelected();
      } else if (e.key === "Delete") s.deleteSelected();
      else if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        const n = e.shiftKey ? 10 : 1;
        s.nudgeSelected(
          e.key === "ArrowLeft" ? -n : e.key === "ArrowRight" ? n : 0,
          e.key === "ArrowUp" ? -n : e.key === "ArrowDown" ? n : 0,
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const saveJson = async () => {
    try {
      const json = await serializeProject(project);
      const url = URL.createObjectURL(
        new Blob([json], { type: "application/json" }),
      );
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = projectFileName(project.metadata.name);
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      showNotice("Не удалось сохранить проект", 
        error instanceof Error ? error.message : "Не удалось сохранить проект.",
      );
    }
  };
  const openJson = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      actions.loadProject(await deserializeProject(await file.text()));
      setReadyToSave(true);
      setExportResult(null);
    } catch (error) {
      showNotice("Не удалось открыть проект",
        error instanceof Error ? error.message : "Не удалось открыть проект.",
      );
    }
  };
  const prepareExport = async () => {
    setExportBusy(true);
    try {
      const html = await exportHtml(project);
      setExportResult({ html, iframe: iframeCode(html) });
    } catch (error) {
      showNotice("Ошибка экспорта",
        error instanceof Error
          ? error.message
          : "Не удалось подготовить экспорт.",
      );
    } finally {
      setExportBusy(false);
    }
  };
  const copyIframe = async () => {
    if (!exportResult) return;
    try {
      if (navigator.clipboard?.writeText)
        await navigator.clipboard.writeText(exportResult.iframe);
      else {
        const field = document.createElement("textarea");
        field.value = exportResult.iframe;
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.append(field);
        field.select();
        document.execCommand("copy");
        field.remove();
      }
      setIframeCopied(true);
      window.setTimeout(() => setIframeCopied(false), 1800);
    } catch {
      showNotice(
        "Не удалось скопировать код",
        "Выделите код iframe и скопируйте его вручную.",
      );
    }
  };
  return (
    <main
      className={styles.app}
      style={{ "--accent": accent } as CSSProperties}
    >
      <header className={styles.toolbar}>
        <div className={styles.brand}>
          <a
            className={styles.channelLogo}
            href="https://vk.ru/club231041939"
            target="_blank"
            rel="noreferrer"
            aria-label="Перейти на канал English Bootcamp во ВКонтакте"
            title="English Bootcamp во ВКонтакте"
          >
            <img
              src={`${import.meta.env.BASE_URL}assets/english-bootcamp-emblem.png`}
              alt="Эмблема English Bootcamp"
            />
          </a>
          <div>
            <strong>Transition Builder</strong>
            <small>by English Bootcamp</small>
          </div>
        </div>
        <nav className={styles.actions}>
          <button
            onClick={() => {
              const createNew = () => {
                actions.newProject();
                void deleteDraft();
                setReadyToSave(true);
              };
              if (!project.layers.length) createNew();
              else
                showConfirm(
                  "Начать новый проект?",
                  "Текущая композиция будет заменена. При необходимости сначала сохраните её в JSON.",
                  createNew,
                  { confirmLabel: "Начать новый", danger: true },
                );
            }}
          >
            Новый
          </button>
          <button onClick={() => projectInput.current?.click()}>
            Открыть JSON
          </button>
          <button onClick={() => void saveJson()}>Сохранить JSON</button>
          <input
            ref={projectInput}
            className={styles.hiddenInput}
            type="file"
            accept="application/json,.json"
            onChange={(event) => void openJson(event)}
          />
          <span className={styles.divider} />
          <button disabled={!past.length} onClick={() => actions.undo()}>
            ↶ Undo
          </button>
          <button disabled={!future.length} onClick={() => actions.redo()}>
            ↷ Redo
          </button>
          <span className={styles.divider} />
          <button
            onClick={() => {
              setRestartKey((key) => key + 1);
              setPreview(true);
            }}
          >
            ▶ Preview
          </button>
          <button onClick={() => setRestartKey((key) => key + 1)}>
            ↻ Restart
          </button>
          <button
            className={styles.primary}
            disabled={exportBusy}
            onClick={() => void prepareExport()}
          >
            {exportBusy ? "Подготовка..." : "Export"}
          </button>
        </nav>
        <div className={styles.saveStatus}>
          <span />
          {saveState === "loading"
            ? "Загрузка..."
            : saveState === "saving"
              ? "Сохранение..."
              : saveState === "error"
                ? "Ошибка сохранения"
                : "Сохранено ✓"}
        </div>
      </header>
      {draftToRestore && (
        <div className={styles.restoreOverlay} role="dialog" aria-modal="true">
          <div className={styles.restoreDialog}>
            <strong>Открыть последнюю сохранённую версию?</strong>
            <p>
              «{draftToRestore.metadata.name}» · сохранено {new Date(
                draftToRestore.metadata.updatedAt,
              ).toLocaleString("ru-RU")}. Все слои и настройки будут восстановлены.
            </p>
            <div>
              <button
                className={styles.primaryDialogAction}
                onClick={() => {
                  actions.loadProject(draftToRestore);
                  setDraftToRestore(null);
                  setReadyToSave(true);
                }}
              >
                Открыть последнюю
              </button>
              <button
                onClick={() => {
                  actions.newProject();
                  setDraftToRestore(null);
                  setReadyToSave(true);
                }}
              >
                Начать новый
              </button>
              <button
                className={styles.dangerDialogAction}
                onClick={() => {
                  void deleteDraft();
                  actions.newProject();
                  setDraftToRestore(null);
                  setReadyToSave(true);
                }}
              >
                Удалить сохранённый
              </button>
            </div>
          </div>
        </div>
      )}
      <aside className={styles.library}>
        <div className={styles.panelTitle}>Добавить</div>
        {sections.map((section) => (
          <button
            style={{ "--tab-color": section.color } as CSSProperties}
            className={section.name === active ? styles.activeSection : ""}
            key={section.name}
            onClick={() => setActive(section.name)}
          >
            <span className={styles.sectionIcon}>{section.name[0]}</span>
            {section.name}
          </button>
        ))}
        {active === "Надпись" && (
          <div className={styles.addCards}>
            <h3>Новая надпись</h3>
            <button onClick={() => actions.addTextLayer()}>
              <b>T</b>
              <span>Добавить текст</span>
            </button>
            <button onClick={() => actions.addImageLayer()}>
              <b>◇</b>
              <span>Картинка-надпись</span>
            </button>
            <p className={styles.warning}>
              Подсказка: объект можно двигать, менять размер и поворачивать
              прямо на сцене.
            </p>
          </div>
        )}
        {active === "Бегущие картинки" && (
          <div className={styles.addCards}>
            <h3>Последовательность</h3>
            <button
              className={styles.wideCard}
              onClick={() => actions.addImageSequenceLayer()}
            >
              <b>◇ ◇ ◇</b>
              <span>Добавить бегущие картинки</span>
            </button>
            <p className={styles.warning}>
              Подсказка: после добавления загрузите до 20 изображений в
              Inspector.
            </p>
          </div>
        )}
        {active === "Эффекты" && (
          <div className={styles.addCards}>
            <h3>Встроенные эффекты</h3>
            {effectDefinitions.map((effect) => (
              <button
                key={effect.type}
                onClick={() => actions.addBuiltInEffect(effect.type)}
              >
                <b>{effect.icon}</b>
                <span>{effect.title}</span>
              </button>
            ))}
            <p className={styles.warning}>
              Эффекты можно растягивать и размещать прямо на сцене.
            </p>
          </div>
        )}
        {active === "Фон" && (
          <BackgroundControls backdrop={backdrop} onBackdrop={setBackdrop} />
        )}
        {active === "Время" && (
          <div className={styles.tabControls}>
            <h3>Время перехода</h3>
            <label>
              Режим
              <select
                value={project.timing.mode}
                onChange={(e) =>
                  actions.updateTiming({
                    mode: e.target.value as "infinite" | "fixed",
                  })
                }
              >
                <option value="infinite">Infinite</option>
                <option value="fixed">Fixed duration</option>
              </select>
            </label>
            {project.timing.mode === "fixed" && (
              <label>
                Длительность — {project.timing.duration} сек.
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={project.timing.duration}
                  onChange={(e) =>
                    actions.updateTiming({ duration: Number(e.target.value) })
                  }
                />
              </label>
            )}
            <h3>Анимация всей сцены</h3>
            <div className={styles.propertyGrid}>
              <label>
                Появление
                <select
                  value={sceneAnimation.enter}
                  onChange={(e) =>
                    actions.updateTiming({
                      sceneAnimation: {
                        ...sceneAnimation,
                        enter: e.target.value as typeof sceneAnimation.enter,
                      },
                    })
                  }
                >
                  <option value="none">None</option>
                  <option value="fade">Fade In</option>
                  <option value="blur">Blur In</option>
                  <option value="zoom">Zoom In</option>
                </select>
              </label>
              <label>
                Завершение
                <select
                  value={sceneAnimation.exit}
                  onChange={(e) =>
                    actions.updateTiming({
                      sceneAnimation: {
                        ...sceneAnimation,
                        exit: e.target.value as typeof sceneAnimation.exit,
                      },
                    })
                  }
                >
                  <option value="none">None</option>
                  <option value="fade">Fade Out</option>
                  <option value="blur">Blur Out</option>
                  <option value="zoom">Zoom Out</option>
                </select>
              </label>
            </div>
            <label>
              Появление — {sceneAnimation.enterDuration.toFixed(1)} сек.
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={sceneAnimation.enterDuration}
                onChange={(e) =>
                  actions.updateTiming({
                    sceneAnimation: {
                      ...sceneAnimation,
                      enterDuration: Number(e.target.value),
                    },
                  })
                }
              />
            </label>
            <label>
              Завершение — {sceneAnimation.exitDuration.toFixed(1)} сек.
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={sceneAnimation.exitDuration}
                onChange={(e) =>
                  actions.updateTiming({
                    sceneAnimation: {
                      ...sceneAnimation,
                      exitDuration: Number(e.target.value),
                    },
                  })
                }
              />
            </label>
            <label>
              Сила эффекта — {sceneAnimation.strength}
              <input
                type="range"
                min="1"
                max="60"
                value={sceneAnimation.strength}
                onChange={(e) =>
                  actions.updateTiming({
                    sceneAnimation: {
                      ...sceneAnimation,
                      strength: Number(e.target.value),
                    },
                  })
                }
              />
            </label>
            <label>
              Easing
              <select
                value={sceneAnimation.easing}
                onChange={(e) =>
                  actions.updateTiming({
                    sceneAnimation: {
                      ...sceneAnimation,
                      easing: e.target.value as typeof sceneAnimation.easing,
                    },
                  })
                }
              >
                <option value="linear">Linear</option>
                <option value="ease">Ease</option>
                <option value="ease-in">Ease In</option>
                <option value="ease-out">Ease Out</option>
                <option value="ease-in-out">Ease In Out</option>
              </select>
            </label>
            <p className={styles.warning}>
              Подсказка: время отдельных слоёв задаётся в их настройках.
            </p>
          </div>
        )}
        {active === "Шаблоны" && (
          <div className={styles.templatePanel}>
            <button
              className={styles.saveAsTemplate}
              disabled={!project.layers.length}
              onClick={() => {
                showPrompt(
                  "Название нового шаблона",
                  "Введите понятное название для текущей композиции.",
                  project.metadata.name,
                  (value) => {
                    const name = value.trim();
                    if (!name) return;
                    void saveTemplate(name, project)
                      .then((item) =>
                        setMyTemplates((items) => [item, ...items]),
                      )
                      .catch(() =>
                        showNotice(
                          "Не удалось сохранить шаблон",
                          "Попробуйте ещё раз или сохраните проект в JSON.",
                        ),
                      );
                  },
                );
              }}
            >
              ＋ Сохранить текущую композицию как шаблон
            </button>
            {myTemplates.length > 0 && (
              <>
                <h3>Мои шаблоны</h3>
                <div className={styles.myTemplateList}>
                  {myTemplates.map((template) => (
                    <div key={template.id}>
                      <button
                        onClick={() => {
                          const applyTemplate = () => {
                            actions.loadProject(template.project);
                            setRestartKey((key) => key + 1);
                          };
                          if (!project.layers.length) applyTemplate();
                          else
                            showConfirm(
                              "Заменить текущую композицию?",
                              `Будет открыт шаблон «${template.name}».`,
                              applyTemplate,
                              { confirmLabel: "Открыть шаблон" },
                            );
                        }}
                      >
                        <strong>{template.name}</strong>
                        <small>{template.project.layers.length} слоёв</small>
                      </button>
                      <button
                        className={styles.deleteTemplate}
                        title="Удалить шаблон"
                        onClick={() => {
                          showConfirm(
                            "Удалить шаблон?",
                            `Шаблон «${template.name}» будет удалён без возможности восстановления.`,
                            () => {
                              void deleteTemplate(template.id).then(() =>
                                setMyTemplates((items) =>
                                  items.filter(
                                    (item) => item.id !== template.id,
                                  ),
                                ),
                              );
                            },
                            { confirmLabel: "Удалить", danger: true },
                          );
                        }}
                      >
                        🗑
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
            <h3>Готовые композиции</h3>
            <p className={styles.warning}>
              Шаблон заменяет текущую композицию. После применения все элементы
              можно редактировать.
            </p>
            <div className={styles.templateList}>
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    const applyTemplate = () => {
                      actions.loadProject(template.create());
                      setRestartKey((key) => key + 1);
                    };
                    if (!project.layers.length) applyTemplate();
                    else
                      showConfirm(
                        "Заменить текущую композицию?",
                        `Будет открыт шаблон «${template.title}».`,
                        applyTemplate,
                        { confirmLabel: "Открыть шаблон" },
                      );
                  }}
                >
                  <span
                    className={styles.templatePreview}
                    style={{
                      background: `linear-gradient(135deg, ${template.colors[0]}, ${template.colors[1]})`,
                    }}
                  >
                    <i>✦</i>
                  </span>
                  <span>
                    <strong>{template.title}</strong>
                    <small>{template.description}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>
      <section className={styles.workspace}>
        <div className={styles.workspaceBar}>
          <span>Сцена</span>
          <span className={styles.sceneMeta}>1920 × 1080 · 16:9</span>
          <div className={styles.sceneTools}>
            <label>
              <input
                type="checkbox"
                checked={gridEnabled}
                onChange={(e) => actions.setGrid(e.target.checked)}
              />{" "}
              Сетка
            </label>
            <select
              value={gridSize}
              onChange={(e) =>
                actions.setGridSize(Number(e.target.value) as 10 | 20 | 50)
              }
              disabled={!gridEnabled}
              aria-label="Шаг сетки"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
            <label>
              <input
                type="checkbox"
                checked={snappingEnabled}
                onChange={(e) => actions.setSnapping(e.target.checked)}
              />{" "}
              Привязка
            </label>
            <label>
              <input
                type="checkbox"
                checked={showSafeArea}
                onChange={(e) => actions.setSafeArea(e.target.checked)}
              />{" "}
              Safe area
            </label>
          </div>
          <div>
            <button>−</button>
            <span>Fit</span>
            <button>+</button>
          </div>
        </div>
        <div className={styles.stageArea}>
          <EditorScene restartKey={restartKey} previewBackdrop={backdrop} />
        </div>
      </section>
      <aside className={styles.inspector}>
        <div className={styles.panelTitle}>Настройки</div>
        <Inspector layer={selected} />
      </aside>
      <section className={styles.layers}>
        <div className={styles.layersHeader}>
          <strong>Слои</strong>
          <span>
            {project.layers.length} объектов ·{" "}
            {formatSize(
              project.assets.reduce((sum, item) => sum + (item.size || 0), 0),
            )}
          </span>
        </div>
        <div className={styles.layerList}>
          {[...project.layers].reverse().map((layer) => (
            <div
              key={layer.id}
              className={`${styles.layerRow} ${layer.id === selectedId ? styles.selectedRow : ""}`}
              onClick={() => actions.selectLayer(layer.id)}
            >
              <button
                title="Показать или скрыть"
                onClick={(e) => {
                  e.stopPropagation();
                  actions.toggleVisible(layer.id);
                }}
              >
                {layer.visible ? "◉" : "○"}
              </button>
              <button
                title="Заблокировать"
                onClick={(e) => {
                  e.stopPropagation();
                  actions.toggleLocked(layer.id);
                }}
              >
                {layer.locked ? "▣" : "□"}
              </button>
              <span>{layer.name}</span>
              <small>{layer.type}</small>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  actions.moveLayer(layer.id, "up");
                }}
              >
                ↑
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  actions.moveLayer(layer.id, "down");
                }}
              >
                ↓
              </button>
              <button
                className={styles.deleteLayer}
                title={`Удалить «${layer.name}»`}
                aria-label={`Удалить ${layer.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  actions.selectLayer(layer.id);
                  actions.deleteSelected();
                }}
              >
                🗑
              </button>
            </div>
          ))}
        </div>
      </section>
      {exportResult && (
        <div className={styles.exportOverlay} role="dialog" aria-modal="true">
          <div className={styles.exportDialog}>
            <div className={styles.exportTitle}>
              <div>
                <strong>Экспорт перехода</strong>
                <small>
                  Автономный HTML · {formatSize(exportSize(exportResult.html))}
                </small>
              </div>
              <button onClick={() => setExportResult(null)}>Закрыть ×</button>
            </div>
            <p>
              Локальные изображения, GIF и пользовательские шрифты уже встроены
              внутрь файла.
            </p>
            {project.assets.some((asset) => asset.source === "url") && (
              <p className={styles.exportWarning}>
                Ресурсы, добавленные по интернет-ссылке, требуют доступ к сети.
                Для полностью автономного результата загрузите их как файлы.
              </p>
            )}
            {exportSize(exportResult.html) > 5 * 1024 * 1024 && (
              <p className={styles.exportWarning}>
                Итоговый файл больше 5 МБ и может загружаться в Genially
                медленно.
              </p>
            )}
            <label>
              Genially iframe srcdoc
              <textarea readOnly value={exportResult.iframe} />
            </label>
            <div className={styles.exportActions}>
              <button
                className={styles.primaryDialogAction}
                onClick={() => void copyIframe()}
              >
                {iframeCopied ? "Скопировано ✓" : "Копировать iframe"}
              </button>
              <button
                onClick={() => {
                  const url = URL.createObjectURL(
                    new Blob([exportResult.html], { type: "text/html" }),
                  );
                  const anchor = document.createElement("a");
                  anchor.href = url;
                  anchor.download = projectFileName(
                    project.metadata.name,
                  ).replace(/\.json$/, ".html");
                  anchor.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Скачать HTML
              </button>
              <button onClick={() => void saveJson()}>
                Сохранить проект JSON
              </button>
              <button onClick={() => projectInput.current?.click()}>
                Загрузить проект JSON
              </button>
            </div>
          </div>
        </div>
      )}
      {appDialog && (
        <div className={styles.appDialogOverlay} role="presentation">
          <form
            className={styles.appDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="app-dialog-title"
            onSubmit={(event) => {
              event.preventDefault();
              if (appDialog.kind === "notice") {
                setAppDialog(null);
                return;
              }
              if (appDialog.kind === "prompt") {
                const value = dialogInput.trim();
                if (!value) return;
                appDialog.onConfirm(value);
              } else appDialog.onConfirm();
              setAppDialog(null);
            }}
          >
            <strong id="app-dialog-title">{appDialog.title}</strong>
            <p>{appDialog.message}</p>
            {appDialog.kind === "prompt" && (
              <input
                autoFocus
                value={dialogInput}
                onChange={(event) => setDialogInput(event.target.value)}
                aria-label="Название"
              />
            )}
            <div>
              <button
                autoFocus={appDialog.kind !== "prompt"}
                className={
                  appDialog.kind === "confirm" && appDialog.danger
                    ? styles.dangerDialogAction
                    : styles.primaryDialogAction
                }
                type="submit"
              >
                {appDialog.kind === "notice"
                  ? "Понятно"
                  : appDialog.confirmLabel ??
                    (appDialog.kind === "prompt" ? "Сохранить" : "Продолжить")}
              </button>
              {appDialog.kind !== "notice" && (
                <button type="button" onClick={() => setAppDialog(null)}>
                  Отмена
                </button>
              )}
            </div>
          </form>
        </div>
      )}
      {preview && (
        <div
          className={styles.previewOverlay}
          role="dialog"
          aria-label="Предпросмотр перехода"
        >
          <div className={styles.previewActions}>
            <button onClick={() => setRestartKey((key) => key + 1)}>
              ↻ Перезапустить
            </button>
            <button onClick={() => setPreview(false)}>Закрыть ×</button>
          </div>
          <EditorScene interactive={false} restartKey={restartKey} />
        </div>
      )}
      <footer className={styles.copyright}>
        <span aria-hidden="true">©</span> Все права принадлежат Башлыковой
        Оксане Михайловне, 2026
      </footer>
    </main>
  );
}
