package expo.modules.retenosdk;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.Context;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.net.Uri;
import android.text.TextUtils;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.reteno.push.RetenoNotifications;

import java.util.Map;

/** Restores notification grouping before the Expo application and push services start. */
public final class RetenoNotificationGroupingRuleProvider extends ContentProvider {
  private static final String PREFERENCES =
    "expo.modules.retenosdk.notification-grouping-rule";
  private static final String PAYLOAD_KEY = "payloadKey";
  private static final String GROUP_ID = "groupId";

  @Override
  public boolean onCreate() {
    Context context = getContext();
    if (context != null) {
      restore(context);
    }
    return true;
  }

  static void configure(
    @Nullable Context context,
    @Nullable String payloadKey,
    @Nullable String groupId
  ) {
    if (context == null) {
      install(payloadKey, groupId);
      return;
    }

    SharedPreferences.Editor editor = preferences(context).edit().clear();
    if (!TextUtils.isEmpty(payloadKey)) {
      editor.putString(PAYLOAD_KEY, payloadKey);
    } else if (!TextUtils.isEmpty(groupId)) {
      editor.putString(GROUP_ID, groupId);
    }
    editor.commit();
    install(payloadKey, groupId);
  }

  private static void restore(@NonNull Context context) {
    SharedPreferences preferences = preferences(context);
    install(
      preferences.getString(PAYLOAD_KEY, null),
      preferences.getString(GROUP_ID, null)
    );
  }

  private static SharedPreferences preferences(@NonNull Context context) {
    return context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE);
  }

  private static void install(@Nullable String payloadKey, @Nullable String groupId) {
    if (!TextUtils.isEmpty(payloadKey)) {
      RetenoNotifications.setGroupingRule((Map<String, String> payload) -> {
        String value = payload.get(payloadKey);
        return TextUtils.isEmpty(value) ? null : value;
      });
    } else if (!TextUtils.isEmpty(groupId)) {
      RetenoNotifications.setGroupingRule((Map<String, String> payload) -> groupId);
    } else {
      RetenoNotifications.setGroupingRule(null);
    }
  }

  @Nullable
  @Override
  public Cursor query(
    @NonNull Uri uri,
    @Nullable String[] projection,
    @Nullable String selection,
    @Nullable String[] selectionArgs,
    @Nullable String sortOrder
  ) {
    return null;
  }

  @Nullable
  @Override
  public String getType(@NonNull Uri uri) {
    return null;
  }

  @Nullable
  @Override
  public Uri insert(@NonNull Uri uri, @Nullable ContentValues values) {
    return null;
  }

  @Override
  public int delete(
    @NonNull Uri uri,
    @Nullable String selection,
    @Nullable String[] selectionArgs
  ) {
    return 0;
  }

  @Override
  public int update(
    @NonNull Uri uri,
    @Nullable ContentValues values,
    @Nullable String selection,
    @Nullable String[] selectionArgs
  ) {
    return 0;
  }
}
