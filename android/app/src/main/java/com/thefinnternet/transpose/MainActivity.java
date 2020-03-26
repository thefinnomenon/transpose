package com.thefinnternet.transpose;

import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactActivity;
import android.content.Intent;
import android.os.Bundle;

import android.net.Uri;

public class MainActivity extends ReactActivity {
  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "transpose";
  }

  /**
   * Add url from share or deep link
   */
   @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new ReactActivityDelegate(this, getMainComponentName()) {
            @Override
            protected Bundle getLaunchOptions() {
                Intent intent = MainActivity.this.getIntent();
                Bundle bundle = new Bundle();
                String action = intent.getAction();
                String url = intent.getStringExtra(Intent.EXTRA_TEXT);
                Uri data = intent.getData();
                // If data isn't null we got deep linked so use it as the url
                // Else we might have a url passed from a share so use that
                if(data != null) {
                    bundle.putString("url", data.toString());
                } else {
                    bundle.putString("url", intent.getStringExtra(Intent.EXTRA_TEXT));
                }
                return bundle;
            }
        };
    }
}
