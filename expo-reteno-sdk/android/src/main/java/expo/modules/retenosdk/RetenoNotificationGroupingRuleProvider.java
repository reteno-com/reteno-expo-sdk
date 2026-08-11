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
  private static final String SHOW_SUMMARY = "showSummary";

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
    @Nullable String groupId,
    boolean showSummary
  ) {
    if (context == null) {
      install(null, payloadKey, groupId, showSummary);
      return;
    }

    SharedPreferences.Editor editor = preferences(context).edit().clear();
    if (!TextUtils.isEmpty(payloadKey)) {
      editor.putString(PAYLOAD_KEY, payloadKey);
    } else if (!TextUtils.isEmpty(groupId)) {
      editor.putString(GROUP_ID, groupId);
    }
    if (showSummary) {
      editor.putBoolean(SHOW_SUMMARY, true);
    }
    // Persist before returning so a process restart cannot lose a just-configured rule.
    editor.commit();
    install(context, payloadKey, groupId, showSummary);
  }

  /** Resolves the group a received push belongs to under the persisted rule. */
  @Nullable
  static String resolveGroup(@NonNull Context context, @NonNull Map<String, String> payload) {
    SharedPreferences preferences = preferences(context);
    String payloadKey = preferences.getString(PAYLOAD_KEY, null);
    if (!TextUtils.isEmpty(payloadKey)) {
      String value = payload.get(payloadKey);
      return TextUtils.isEmpty(value) ? null : value;
    }
    String groupId = preferences.getString(GROUP_ID, null);
    return TextUtils.isEmpty(groupId) ? null : groupId;
  }

  private static void restore(@NonNull Context context) {
    SharedPreferences preferences = preferences(context);
    install(
      context,
      preferences.getString(PAYLOAD_KEY, null),
      preferences.getString(GROUP_ID, null),
      preferences.getBoolean(SHOW_SUMMARY, false)
    );
  }

  private static SharedPreferences preferences(@NonNull Context context) {
    return context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE);
  }

  private static void install(
    @Nullable Context context,
    @Nullable String payloadKey,
    @Nullable String groupId,
    boolean showSummary
  ) {
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
    // The summary manager needs a real Context; skip it if none is available yet.
    if (context != null) {
      RetenoNotificationSummaryManager.setEnabled(
        context,
        showSummary && (!TextUtils.isEmpty(payloadKey) || !TextUtils.isEmpty(groupId)),
        !TextUtils.isEmpty(payloadKey) ? "payloadKey:" + payloadKey : "groupId:" + groupId
      );
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
