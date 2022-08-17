import { ContentGravity, Stage } from '@imports/clutter10';
import { File, FileCreateFlags } from '@imports/gio2';
import { Global } from '@imports/shell0';
import { TextureCache, ThemeContext } from '@imports/st1';
import { registerGObjectClass } from '@pano/utils/gjs';
import { PanoItemTypes } from '@pano/utils/panoItemType';
import { PanoItem } from '@pano/components/panoItem';
import { ClipboardContent, clipboardManager, ContentType } from '@pano/utils/clipboardManager';
import { db } from '@pano/utils/db';
import { getImagesPath } from '@pano/utils/shell';
import { ChecksumType, compute_checksum_for_bytes } from '@imports/glib2';
import { Pixbuf } from '@imports/gdkpixbuf2';

const global = Global.get();

@registerGObjectClass
export class ImagePanoItem extends PanoItem {
  private clipboardContent: Uint8Array;

  constructor(id: number | null, content: Uint8Array, date: Date) {
    super(id, PanoItemTypes.IMAGE, date);

    this.clipboardContent = content;

    this.body.style_class = [this.body.style_class, 'pano-item-body-image'].join(' ');
    const scaleFactor = ThemeContext.get_for_stage(global.stage as Stage).scale_factor;
    const imageFilePath = `${getImagesPath()}/${compute_checksum_for_bytes(ChecksumType.MD5, content)}.png`;
    const imageFile = File.new_for_path(imageFilePath);
    if (!imageFile.query_exists(null)) {
      imageFile.replace_contents(this.clipboardContent, null, false, FileCreateFlags.REPLACE_DESTINATION, null);
    }
    const actor = TextureCache.get_default().load_file_async(
      imageFile,
      -1,
      220,
      scaleFactor,
      this.body.get_resource_scale(),
    );
    if (actor) {
      actor.content_gravity = ContentGravity.RESIZE_ASPECT;
      actor.margin_top = 10;
      actor.margin_bottom = 10;
      actor.margin_right = 0;
      actor.margin_left = 0;
      this.body.add_child(actor);
    }

    if (!this.dbId) {
      const checksum = compute_checksum_for_bytes(ChecksumType.MD5, this.clipboardContent);
      if (checksum) {
        const [, width, height] = Pixbuf.get_file_info(imageFilePath);
        const savedItem = db.save({
          content: checksum,
          copyDate: date,
          isFavorite: false,
          itemType: 'IMAGE',
          matchValue: checksum,
          metaData: JSON.stringify({
            width,
            height,
            size: content.length,
          }),
        });
        if (savedItem) {
          this.dbId = savedItem.id;
        }
      }
    }

    this.connect('activated', this.setClipboardContent.bind(this));
  }

  private setClipboardContent(): void {
    clipboardManager.setContent(
      new ClipboardContent({
        type: ContentType.IMAGE,
        value: this.clipboardContent,
      }),
    );
  }
}
